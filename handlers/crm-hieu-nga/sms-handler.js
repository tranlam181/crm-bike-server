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

var sendSms = (ipphone, number, content, secret_key, url_api) => {
    return new Promise((resol, reject) => {
        let data = {
          "ipphone": ipphone,
          "number": number,
          "content": content
        }
        const token = jwt.sign(data, secret_key, {
          expiresIn: 1*86400 // sec ~ 1day
        })

        request.post(url_api,
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

        sendSms(sms.ipphone, sms.numer, sms.content, jwtConfig.secret3C, jwtConfig.baseUrlSms3C)
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
      console.log('zo db roi');
      // 1. Query cac rows co thoi gian nhan tin vao thoi diem job chay
      let hour = Number(new Date().getHours())
      let sql = `SELECT * FROM sms_config WHERE sms_hour = ?`
      let params = [hour]

      let rows = await db.getRsts(sql, params)
      // 2. Voi moi row, query cac xe trung thoi diem nhan tin

      sql = `SELECT   b.phone, b.full_name_no_sign, c.name, d.address
                  FROM   xe a,
                        khach_hang b,
                        dm_loai_xe c,
                        dm_cua_hang d`

      for (let row of rows) {
        if (row.type == 'SMS KTDK' || row.type == 'SMS BDTB' || row.type == 'SMS MUA XE') {
          sql += ` WHERE       date (a.buy_date, 'unixepoch', '+? day') = date ('now')
                        AND a.khach_hang_id = b.id
                        AND a.loai_xe_id = c.id
                        AND a.cua_hang_id = d.id`
          params = [row.n_day_after]

        } else if (row.type == 'SMS SINH NHAT') {
          sql = ` WHERE       date (b.birthday, 'unixepoch', '+? day') = date ('now')
                        AND a.khach_hang_id = b.id
                        AND a.loai_xe_id = c.id
                        AND a.cua_hang_id = d.id`
          params = [row.n_day_after]
        } else if (row.type == 'SMS SAU 6 THANG DICH VU') {
          sql = ` WHERE       date (a.last_service_date, 'unixepoch', '+? day') = date ('now')
                        AND a.khach_hang_id = b.id
                        AND a.loai_xe_id = c.id
                        AND a.cua_hang_id = d.id`
          params = [row.n_day_after]
        }
      }
      // 3. Thuc hien nhan tin, luu vao bang history de theo doi, bao cao
    }
}

module.exports = {
    Handler: new Handler()
};
