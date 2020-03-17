"use strict";

const db = require("../../db/sqlite3/crm-hieu-nga-dao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../../jwt/jwt-config");
const request = require("request");

var login3C = (ipphone, secret_3c) => {
  return new Promise((resol, reject) => {
    let payload = {
      ipphone: ipphone
    };

    const login_3C_token = jwt.sign(payload, secret_3c, {});
    // console.log(login_3C_token);

    var smsReq = request.post(
      "https://3c-capi.mobifone.vn/0702300501/thirdParty/login",
      {
        json: {
          token: login_3C_token
        },
        timeout: 5000
      },
      (error, res, body) => {
        if (error) {
          return reject(error);
        } else if (body.code == "errors") {
          return reject({ status: "NOK", msg: body.message });
        } else {
          return resol({ status: "OK", data: body });
        }
      }
    );

    smsReq.on("error", err => {
      return reject(err);
    });
  });
};

exports.register = async (req, res, next) => {
  let user = req.json_data;
  user.user_name = user.user_name.toUpperCase().trim();
  user.password = user.password.trim();

  let sql = `SELECT COUNT(1) AS count FROM user WHERE user_name = ?`;
  let params = [user.user_name];

  let result = await db.getRst(sql, params);

  if (result.count >= 1) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(
      JSON.stringify({
        status: "NOK",
        msg: `User ${user.user_name} đã tồn tại rồi`
      })
    );
  }

  bcrypt.hash(user.password, 10, function(err, hash) {
    let sql = `INSERT INTO user (user_name, password, register_datetime) VALUES (?,?,strftime('%s', datetime('now', 'localtime')))`;
    let params = [user.user_name, hash];
    db.runSql(sql, params)
      .then(result => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        return res.end(
          JSON.stringify({
            status: "OK",
            msg: "Đăng ký user thành công",
            count: result.changes
          })
        );
      })
      .catch(err => {
        return res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  });
};

exports.login = async (req, res, next) => {
  let user = req.json_data;
  user.user_name = user.user_name.toUpperCase().trim();
  user.password = user.password.trim();
  let sql = `SELECT id,
                        nhom_id,
                        user_name,
                        password,
                        cua_hang_id,
                        (SELECT MAX(name) FROM dm_cua_hang WHERE id=user.cua_hang_id) AS shop_name,
                        link_3c,
                        ipphone
                    FROM user
                    WHERE user_name = ?`;
  let params = [user.user_name];

  let userDB = await db.getRst(sql, params);

  if (!userDB || !userDB.id) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(
      JSON.stringify({
        status: "NOK",
        msg: `User ${user.user_name} không tồn tại`
      })
    );
  }

  // To check a password
  bcrypt.compare(user.password, userDB.password, function(err, result) {
    // res == true
    if (result) {
      // login thanh cong, return token
      // Loai bo password, nhay cam
      delete userDB.password;

      const token = jwt.sign(userDB, jwtConfig.secret, {
        expiresIn: jwtConfig.tokenLife
      });

      sql = `UPDATE user SET last_login_datetime = strftime('%s', datetime('now', 'localtime')) WHERE id=?`;
      params = [userDB.id];
      db.getRst(sql, params);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });
      return res.end(
        JSON.stringify({
          status: "OK",
          msg: `User ${user.user_name} login thành công`,
          token: token,
          user: userDB
        })
      );
    } else {
      res.writeHead(400, {
        "Content-Type": "application/json; charset=utf-8"
      });
      return res.end(
        JSON.stringify({
          status: "NOK",
          msg: `User ${user.user_name} mật khẩu không đúng`
        })
      );
    }
  });
};

exports.logout = (req, res, next) => {
  return res.status(200).end(
    JSON.stringify({
      status: "OK",
      msg: `User ${req.user.user_name} logout thành công`
    })
  );
};

exports.getUsers = (req, res, next) => {
  db.getRsts(
    `SELECT id, user_name, ipphone
            FROM user
            ORDER BY nhom_id, id`
  )
    .then(row => {
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });
      return res.end(JSON.stringify(row));
    })
    .catch(err => {
      return res
        .status(400)
        .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    });
};

exports.saveUsers = async (req, res, next) => {
  let users = req.json_data;
  let sql = "";
  let params = [];
  let payload;
  let token_call_3C;
  let hashed_password;

  try {
    for (let user of users) {
      // generate token to call 3C
      sql = `SELECT (SELECT value FROM app_config WHERE id=4) AS link_call_3c,
                    (SELECT value FROM app_config WHERE id=2) AS secret_3c`;
      params = [];

      let config = await db.getRst(sql, params);

      payload = {
        ipphone: user.ipphone
      };

      token_call_3C = jwt.sign(payload, config.secret_3c, {});

      if (user.password) {
        hashed_password = await bcrypt.hash(user.password, 10);
      } else {
        hashed_password = null;
      }

      sql = `UPDATE user
                        SET
                            link_3c = ?,
                            ipphone = ?,
                            password = (CASE WHEN ? IS NULL THEN password ELSE ? END),
                            update_user = ?,
                            update_datetime = strftime('%s', datetime('now', 'localtime'))
                        WHERE
                            id = ?`;
      params = [
        `${config.link_call_3c}?token=${token_call_3C}&number=`,
        user.ipphone,
        hashed_password,
        hashed_password,
        req.userInfo.id,
        user.id
      ];

      await db.runSql(sql, params);
    }

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(
      JSON.stringify({ status: "OK", msg: "Lưu cấu hình thành công" })
    );
  } catch (err) {
    return res
      .status(400)
      .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
};

exports.testLogin3C = (req, res, next) => {
  login3C("290_567", "+ocuTJLDKy5+kbM")
    .then(data => {
      return res.end(
        JSON.stringify(Object.assign(data, { msg: "Login 3C thanh cong" }))
      );
    })
    .catch(err => {
      return res
        .status(400)
        .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    });
};
