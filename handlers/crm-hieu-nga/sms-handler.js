"use strict";
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require("../../db/sqlite3/crm-hieu-nga-dao");
const jwt = require("jsonwebtoken");
const request = require("request");
const UTILS = require("../../utils/utils");
const support = require("./support");

var sendSms = (ipphone, number, content, link_sms_3c, secret_3c) => {
  return new Promise((resol, reject) => {
    let data = {
      ipphone: ipphone,
      number: number,
      content: content
    };
    const token = jwt.sign(data, secret_3c, {
      expiresIn: 1 * 86400 // sec ~ 1day
    });

    resol({ status: "OK", msg: "Nhắn thành công" });

    // request.post(
    //   link_sms_3c,
    //   {
    //     json: {
    //       token: token
    //     }
    //   },
    //   (error, res, body) => {
    //     if (error) {
    //       reject(error);
    //     } else if (body.code == "errors") {
    //       reject({ status: "NOK", msg: body.message });
    //     } else {
    //       resol({ status: "OK", msg: body.message });
    //     }
    //   }
    // );
  });
};

class Handler {
  getSmsConfig(req, res, next) {
    db.getRsts(
      `SELECT *
            FROM sms_config
            ORDER BY id`
    )
      .then(row => {
        res.writeHead(200, UTILS.RESPONSE_HEADER);
        res.end(JSON.stringify(row));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  async saveSmsConfig(req, res, next) {
    let sms_configs = req.json_data;
    let sql = "";
    let params = [];

    for (let sms_config of sms_configs) {
      sql = `UPDATE sms_config
                    SET
                        n_day_after = ?,
                        content = ?,
                        update_datetime = strftime('%s', datetime('now', 'localtime')),
                        update_user = ?
                    WHERE
                        id = ?`;
      params = [
        sms_config.n_day_after,
        sms_config.content,
        req.userInfo.id,
        sms_config.id
      ];

      await db.runSql(sql, params);
    }

    res.writeHead(200, UTILS.RESPONSE_HEADER);
    res.end(JSON.stringify({ status: "OK", msg: "Lưu cấu hình thành công" }));
  }

  sendSmsRequest(req, res, next) {
    let sms = req.json_data;
    let sql = `SELECT
                    (SELECT value FROM app_config WHERE id=3) AS link_sms_3c,
                    (SELECT value FROM app_config WHERE id=2) AS secret_3c,
                    (SELECT value FROM app_config WHERE id=5) AS ipphone_sms`;
    let params = [];

    db.getRst(sql, params)
      .then(config => {
        return sendSms(
          config.ipphone_sms,
          sms.number,
          sms.content,
          config.link_sms_3c,
          config.secret_3c
        ).then(rs => {
          return support
            ._updateAfterSms(
              sms.xe_id,
              sms.khach_hang_id,
              null,
              sms.content,
              sms.chien_dich_id
            )
            .then(() => {
              res.writeHead(200, UTILS.RESPONSE_HEADER);
              res.end(JSON.stringify({ status: "OK", msg: rs.msg }));
            });
        });
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  async sendSmsList(req, res, next) {
    let sms_list = req.json_data;
    let sms;
    let sql = `SELECT
                    (SELECT value FROM app_config WHERE id=3) AS link_sms_3c,
                    (SELECT value FROM app_config WHERE id=2) AS secret_3c,
                    (SELECT value FROM app_config WHERE id=5) AS ipphone_sms`;
    let params = [];

    db.getRst(sql, params)
      .then(async config => {
        for (let e of sms_list) {
          sql = `SELECT ss.xe_id,
                        ss.sms_type_id,
                        x.khach_hang_id,
                        kh.phone,
                        --kh.full_name_no_sign,
                        --lx.name,
                        --ch.address,
                        REPLACE (REPLACE (REPLACE (sc.content, '{{ho_ten}}', kh.full_name_no_sign), '{{loai_xe}}', lx.name),
                                '{{ten_head}}',
                                ch.address) content
                FROM   sms_schedule ss,
                        (SELECT   id, khach_hang_id, cua_hang_id, loai_xe_id
                          FROM   xe
                          WHERE   id = ?) x,
                        (SELECT   id, content
                          FROM   sms_config
                          WHERE   id = ?) sc,
                        khach_hang kh,
                        dm_cua_hang ch,
                        dm_loai_xe lx
                WHERE       ss.xe_id = ?
                        AND ss.sms_type_id = ?
                        AND ss.sms_datetime IS NULL -- chua nhan
                        AND ss.xe_id = x.id
                        AND ss.sms_type_id = sc.id
                        AND x.khach_hang_id = kh.id
                        AND x.cua_hang_id = ch.id
                        AND x.loai_xe_id = lx.id`;

          params = [e.xe_id, e.sms_type_id, e.xe_id, e.sms_type_id];

          sms = await db.getRst(sql, params);

          if (!sms) {
            // khong co ban ghi nao
            e.result = "Đã nhắn rồi";
            continue;
          }

          try {
            await sendSms(
              config.ipphone_sms,
              sms.phone,
              sms.content,
              config.link_sms_3c,
              config.secret_3c
            );

            e.result = "Thành công";

            await support._updateAfterSms(
              sms.xe_id,
              sms.khach_hang_id,
              sms.sms_type_id,
              sms.content,
              0
            );
          } catch (err) {
            e.result = err.msg;
          }
        }

        res.writeHead(200, UTILS.RESPONSE_HEADER);
        res.end(
          JSON.stringify({
            status: "OK",
            msg: "Đã nhắn sms xong",
            sms_list: sms_list
          })
        );
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  getSmsList(req, res, next) {
    let filter = req.query.filter; // birthday|ktdk|thank-4-buying|after-6-month-service|range loc danh sach gi
    let from_date = req.query.from_date;
    let to_date = req.query.to_date;
    let userInfo = req.userInfo;
    let params = [];
    let sql = `SELECT
              a.id as xe_id,
              a.khach_hang_id,
              (SELECT MAX(short_name) FROM dm_cua_hang where id=a.cua_hang_id) AS shop_name,
              (SELECT MAX(name) FROM dm_loai_xe where id=a.loai_xe_id) AS bike_name,
              a.frame_number,
              a.engine_number,
              a.bike_number,
              strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,
              a.warranty_number,
              b.full_name,
              b.phone,
              b.phone_2,
              strftime ('%d/%m/%Y', b.birthday, 'unixepoch') AS birthday,
              b.sex,
              b.address,
              strftime ('%d/%m/%Y', s.sms_date_schedule, 'unixepoch') AS sms_date_schedule,
              sc.type,
              sc.id sms_type_id`;
    switch (filter) {
      case "ktdk":
        sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id IN (1,2,3,4,5,6,7,8)
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND s.sms_datetime IS NULL
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`;
        params = [userInfo.cua_hang_id, userInfo.cua_hang_id];
        break;
      case "birthday":
        sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id = 9
                        AND strftime ('%m', s.sms_date_schedule, 'unixepoch') = strftime ('%m', 'now')
                        AND strftime ('%d', s.sms_date_schedule, 'unixepoch') = strftime ('%d', 'now')
                        AND (s.sms_datetime IS NULL OR s.sms_datetime < strftime('%s', date('now')))
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`;
        params = [userInfo.cua_hang_id, userInfo.cua_hang_id];
        break;
      case "thank-4-buying":
        sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id = 10
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND s.sms_datetime IS NULL
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`;
        params = [userInfo.cua_hang_id, userInfo.cua_hang_id];
        break;
      case "after-6-month-service":
        sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id = 11
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND (s.sms_datetime IS NULL OR s.sms_datetime < s.sms_date_schedule)
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`;
        params = [userInfo.cua_hang_id, userInfo.cua_hang_id];
        break;
      case "range":
        sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id IN (1,2,3,4,5,6,7,8)
                        AND s.sms_date_schedule >= strftime('%s', ?)
                        AND s.sms_date_schedule < strftime('%s', date(?, '+1 day'))
                        AND s.sms_datetime IS NULL
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`;
        params = [
          from_date,
          to_date,
          userInfo.cua_hang_id,
          userInfo.cua_hang_id
        ];
        break;

      default:
        break;
    }

    db.getRsts(sql, params)
      .then(row => {
        res.writeHead(200, UTILS.RESPONSE_HEADER);
        res.end(JSON.stringify(row));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  getSmsHistories(req, res, next) {
    let xe_id = req.query.xe_id;

    if (!xe_id || xe_id == "undefined") xe_id = "";

    db.getRsts(
      `
          SELECT
            (CASE
                WHEN a.muc_dich_goi_ra_id IS NULL THEN b.type
                ELSE (select max(name) from dm_muc_dich_goi_ra WHERE id=a.muc_dich_goi_ra_id)
            END) type,
            a.content,
            strftime ('%d/%m/%Y %H:%M', a.sms_datetime, 'unixepoch') AS sms_datetime
          FROM  sms_history a LEFT OUTER JOIN sms_config b ON a.sms_type_id=b.id
          WHERE a.xe_id=?
          ORDER BY a.sms_datetime`,
      [xe_id]
    )
      .then(row => {
        res.writeHead(200, UTILS.RESPONSE_HEADER);
        res.end(JSON.stringify(row));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }
}

module.exports = {
  Handler: new Handler()
};
