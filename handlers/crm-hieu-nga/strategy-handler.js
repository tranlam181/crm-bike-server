"use strict"

const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const {removeVietnameseFromString} = require('../../utils/utils')
const support = require('./support')

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
      let chien_dich_id = req.params.chien_dich_id
      let sql = `DELETE FROM chien_dich_xe WHERE chien_dich_id=?`

      db.runSql(sql,[chien_dich_id])
      .then(() => {
        sql = `DELETE FROM chien_dich WHERE id=?`
        return db.runSql(sql, [chien_dich_id])
      }).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({status:'OK', msg:'Xóa chiến dịch thành công'}))
      }).catch(err => {
        res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }

    async importStrategyBike(req, res, next) {
      let customer = req.json_data

      try {
          // console.log(customer);
          // Xu ly danh muc ma loai xe
          support._updateCategory('dm_ma_loai_xe', {name: customer.bike_code})
          // Xu ly danh muc loai xe
          support._updateCategory('dm_loai_xe', {name: customer.bike_name})
          // Xu ly danh muc mau xe
          support._updateCategory('dm_mau_xe', {name: customer.bike_color})
          // Xu ly danh muc quan,tp
          support._updateCategory('dm_quan_huyen', {province: customer.province, district: customer.district})
          // Xu ly nghe nghiep
          support._updateCategory('dm_nghe_nghiep', {name: customer.job})
          // Xu ly tinh trang xe
          support._updateCategory('dm_tinh_trang_xe', {name: customer.y_kien_mua_xe})

          // import khach hang
          let customer_result = await support._importCustomer(customer)
          // import xe
          let bike_result = await support._importBike(customer, customer_result.khach_hang_id)
          // import vao chien dich
          let strategy_bike_result = await support._importStrategyBike(customer.chien_dich_id, bike_result.xe_id, customer.cua_hang_id)

          if (strategy_bike_result.status != 'OK') {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({status:'NOK', msg: strategy_bike_result.msg, err: strategy_bike_result, stt:customer.A}))
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({status:'OK', msg:'Thành công'}))
      } catch (err) {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      }
  }
}

module.exports = {
    Handler: new Handler()
};
