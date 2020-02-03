"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const jwt = require('jsonwebtoken')
const request = require('request')
const {removeVietnameseFromString} = require('../../utils/utils')

var sendSms = (ipphone, number, content, link_sms_3c, secret_3c) => {
    return new Promise((resol, reject) => {
        let data = {
          "ipphone": ipphone,
          "number": number,
          "content": content
        }
        const token = jwt.sign(data, secret_3c, {
          expiresIn: 1*86400 // sec ~ 1day
        })

        request.post(link_sms_3c,
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
                        update_datetime = strftime('%s', datetime('now', 'localtime')),
                        update_user = ?
                    WHERE
                        id = ?`
            params = [
                sms_config.n_day_after,
                sms_config.content,
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
        let sql = `SELECT (SELECT value FROM app_config WHERE id=3) AS link_sms_3c,(SELECT value FROM app_config WHERE id=2) AS secret_3c`
        let params = []

        db.getRst(sql, params).then(config => {
          return sendSms(sms.ipphone, sms.numer, sms.content, config.link_sms_3c, config.secret_3c)
          .then(rs => {
            sql = `INSERT INTO sms_history`
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg: result.msg}))
          })
        }).catch(err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    getSmsList(req, res, next) {
      let filter = req.query.filter // birthday|ktdk|thank-4-buying|after-6-month-service|range loc danh sach gi
      let from_date = req.query.from_date
      let to_date = req.query.to_date
      let userInfo = req.userInfo
      let params = []
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
              sc.type`
      switch (filter) {
        case 'ktdk':
          sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id IN (1,2,3,4,5,6,7,8)
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND s.sms_datetime IS NULL
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`
          params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
          break;
        case 'birthday':

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
                        AND (? IS NULL OR a.cua_hang_id=?)`
          params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
          break;
        case 'thank-4-buying':

          sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id = 10
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND s.sms_datetime IS NULL
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`
          params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
          break;
        case 'after-6-month-service':
          sql += `
                  FROM   sms_schedule s, sms_config sc, xe a, khach_hang b
                WHERE
                        s.sms_type_id = 11
                        AND s.sms_date_schedule = strftime('%s', date('now'))
                        AND (s.sms_datetime IS NULL OR s.sms_datetime < s.sms_date_schedule)
                        AND s.sms_type_id = sc.id
                        AND s.xe_id = a.id
                        AND a.khach_hang_id = b.id
                        AND (? IS NULL OR a.cua_hang_id=?)`
          params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
          break;
        case 'range':
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
                        AND (? IS NULL OR a.cua_hang_id=?)`
          params = [from_date, to_date, userInfo.cua_hang_id, userInfo.cua_hang_id]
          break;

        default:
          break;
      }

      db.getRsts(sql, params).then(row => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(row));
      }).catch(err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
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
        for (let config of sms_configs) {
          sql = `SELECT   a.id AS xe_id,
                        a.khach_hang_id,
                        a.cua_hang_id,
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
                        cua_hang_id,
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
                        ?,
                        strftime('%s', datetime('now', 'localtime'))
                    )`
            params = [
              target.xe_id,
              target.khach_hang_id,
              target.cua_hang_id,
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
