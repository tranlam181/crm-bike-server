"use strict"

const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const {removeVietnameseFromString} = require('../../utils/utils')

class Handler {
    async addStrategy(req, res, next) {
        let strategy = req.json_data

        let sql = `SELECT COUNT(1) count_row FROM chien_dich WHERE name_no_sign=? AND date_sta=strftime('%s', ?) AND date_end=strftime('%s', ?)`
        let params = [removeVietnameseFromString(strategy.name), strategy.date_sta, strategy.date_end]

        let check_rs = await db.getRst(sql, params)

        if (check_rs.count_row > 0) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({status:'NOK', msg:'Chiến dịch này đã tồn tại'}))
          return
        }

        sql = `INSERT INTO chien_dich(
                      name,
                      date_sta,
                      date_end,
                      name_no_sign
                    )
                    VALUES (
                      ?,
                      strftime('%s', ?),
                      strftime('%s', ?),
                      ?
                    )`
        params = [strategy.name, strategy.date_sta, strategy.date_end, removeVietnameseFromString(strategy.name)]

        db.runSql(sql, params).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({status:'OK', msg:'Lưu chiến dịch thành công'}))
        }).catch (err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    getStrategies(req, res, next) {
      let sql = `SELECT
                    id chien_dich_id,
                    name,
                    strftime ('%d/%m/%Y', date_sta, 'unixepoch') as date_sta ,
                    strftime ('%d/%m/%Y', date_end, 'unixepoch') as date_end
                FROM chien_dich ORDER BY date_sta`

      db.getRsts(sql, [])
      .then(row => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(row));
      }).catch(err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }

    delStrategy(req, res, next) {
      let strategy_id = req.params.strategy_id

      let sql = `DELETE FROM chien_dich WHERE id=?`

      db.getRsts(sql, [strategy_id])
      .then(row => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({status:'OK', msg:'Xóa chiến dịch thành công'}))
      }).catch(err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
}

module.exports = {
    Handler: new Handler()
};
