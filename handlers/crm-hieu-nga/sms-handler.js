"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const jwtConfig = require('../../jwt/jwt-config')
const jwt = require('jsonwebtoken')
const request = require('request')
const {removeVietnameseFromString} = require('../../utils/utils')

var sendSms = (ipphone, number, content) => {
    return new Promise((resol, reject) => {
        let data = {
          "ipphone": ipphone,
          "number": number,
          "content": content
        }
        const token = jwt.sign(data, jwtConfig.secret3C, {
          expiresIn: 1*86400 // sec ~ 1day
        })

        request.post(jwtConfig.baseUrlSms3C,
          {
            json: {
              token: token
            }
          },
          (error, res, body) => {
            if (error) {
              reject(error)
            } else if (body.code == 'errors') {
              reject({status:'NOK', msg:body.message})
            } else {
              resol({status:'OK', msg:body.message})
            }
          }
        )
    })
}

class Handler {
    getSmsConfig(req, res, next) {
        db.getRsts(`SELECT *
            FROM sms_config
            ORDER BY id`
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    async saveSmsConfig(req, res, next) {
        let sms_configs = req.json_data
        let sql = ''
        let params = []

        for (let sms_config of sms_configs) {
            sql = `UPDATE sms_config
                    SET
                        n_day_after = ?,
                        content = ?,
                        sms_hour = ?,
                        update_datetime = strftime('%s', datetime('now', 'localtime')),
                        update_user = ?
                    WHERE
                        id = ?`
            params = [
                sms_config.n_day_after,
                sms_config.content,
                sms_config.sms_hour,
                req.userInfo.id,
                sms_config.id
            ]

            await db.runSql(sql, params)
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({status:'OK', msg:'Lưu cấu hình thành công'}))
    }

    sendSmsRequest(req, res, next) {
        let sms = req.json_data

        sendSms(sms.ipphone, sms.numer, sms.content)
        .then(result => {
            let sql = `INSERT INTO sms_history`
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg: result.msg}))
        }).catch(err => {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'NOK', msg: err.msg}))
        })
    }

    async sendSmsJob() {
      // 1. Query cac sms config co thoi gian nhan tin vao thoi diem job chay
      console.log('sendSmsJob');
      let hour = Number(new Date().getHours())
      let sql = `SELECT * FROM sms_config WHERE sms_hour = ?`
      let params = [hour]
      let sms_configs = await db.getRsts(sql, params)
      let sms_targets
      let content

      try {
        // 2. Voi moi config, query cac xe trung thoi diem nhan tin
        console.log(sms_configs);
        for (let config of sms_configs) {
          sql = `SELECT   a.id AS xe_id,
                        a.khach_hang_id,
                        b.phone,
                        b.full_name_no_sign AS ho_ten,
                        c.name AS loai_xe,
                        d.address AS ten_head
                    FROM   xe a,
                          khach_hang b,
                          dm_loai_xe c,
                          dm_cua_hang d`
                          // date (a.buy_date, 'unixepoch', '+${config.n_day_after} day') = date ('now')
                          // AND
          if (config.type == 'SMS KTDK' || config.type == 'SMS BDTB' || config.type == 'SMS MUA XE') {
            sql += ` WHERE        a.khach_hang_id = b.id
                          AND a.loai_xe_id = c.id
                          AND a.cua_hang_id = d.id
                          LIMIT 2`
            params = []

            sms_targets = await db.getRsts(sql, params).catch(err => console.error('err SMS KTDK', err))
            // date (b.birthday, 'unixepoch', '+${config.n_day_after} day') = date ('now')
            // AND
          } else if (config.type == 'SMS SINH NHAT') {
            sql += ` WHERE        a.khach_hang_id = b.id
                          AND a.loai_xe_id = c.id
                          AND a.cua_hang_id = d.id LIMIT 2`
            params = []

            sms_targets = await db.getRsts(sql, params).catch(err => console.error('err SMS SINH NHAT', err))
            // date (a.last_service_date, 'unixepoch', '+${config.n_day_after} day') = date ('now')
            // AND
          } else if (config.type == 'SMS SAU 6 THANG DICH VU') {
            sql += ` WHERE        a.khach_hang_id = b.id
                          AND a.loai_xe_id = c.id
                          AND a.cua_hang_id = d.id LIMIT 2`
            params = []

            sms_targets = await db.getRsts(sql, params).catch(err => console.error('err SMS SAU 6 THANG DICH VU', err))
          }

          // 3. Thuc hien nhan tin, luu vao bang history de theo doi, bao cao
          console.log(sms_targets);

          for (let target of sms_targets) {
            // sendSms(jwtConfig.ipphoneSms3C, target.phone, config.content)

            content = config.content
                        .replace("{{ho_ten}}", target.ho_ten)
                        .replace("{{loai_xe}}", removeVietnameseFromString(target.loai_xe))
                        .replace("{{ten_head}}", target.ten_head)

            sql = `INSERT INTO sms_history
                    (
                        xe_id,
                        khach_hang_id,
                        type,
                        type_detail,
                        content,
                        sms_datetime
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime'))
                    )`
            params = [
              target.xe_id,
              target.khach_hang_id,
              config.type,
              config.type_detail,
              content,
            ]

            db.runSql(sql, params)
          }
        }
      } catch(err) {
        console.log('err', err)
      }
    }
}

module.exports = {
    Handler: new Handler()
};
