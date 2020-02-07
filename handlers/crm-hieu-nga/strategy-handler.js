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
                      loai_chien_dich_id,
                      name,
                      date_sta,
                      date_end,
                      name_no_sign
                    )
                    VALUES (
                      ?,
                      ?,
                      strftime('%s', ?),
                      strftime('%s', ?),
                      ?
                    )`
        params = [
            strategy.loai_chien_dich_id,
           strategy.name,
           strategy.date_sta,
           strategy.date_end,
           removeVietnameseFromString(strategy.name)
        ]

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
                    (select max(name) from dm_loai_chien_dich where id=chien_dich.loai_chien_dich_id) loai_chien_dich,
                    name,
                    strftime ('%d/%m/%Y', date_sta, 'unixepoch') as date_sta ,
                    strftime ('%d/%m/%Y', date_end, 'unixepoch') as date_end
                FROM chien_dich
                ORDER BY date_sta`

      db.getRsts(sql, [])
      .then(row => {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(row));
      }).catch(err => {
          res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }

    getCalloutCustomers(req, res, next) {
      let chien_dich_id = req.params.chien_dich_id
      let userInfo = req.userInfo

      let sql = `SELECT
                  (strftime ('%s', date ('now')) - a.last_service_date) / 60 / 60 / 24 / 30.0 month_not_come,
                  a.id as xe_id,
                  a.khach_hang_id,
                  (SELECT MAX(short_name) FROM dm_cua_hang where id=a.cua_hang_id) AS shop_name,
                  a.loai_xe_id,
                  (SELECT MAX(name) FROM dm_loai_xe where id=a.loai_xe_id) AS bike_name,
                  a.mau_xe_id,
                  a.frame_number,
                  a.engine_number,
                  a.bike_number,
                  strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,
                  a.warranty_number,
                  strftime ('%d/%m/%Y', a.last_call_date, 'unixepoch') AS last_call_date,
                  strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') AS last_service_date,
                  (SELECT MAX(name) FROM dm_yeu_cau where id=a.last_yeu_cau_id) AS last_yeu_cau,
                  b.full_name,
                  b.phone,
                  b.phone_2,
                  strftime ('%d/%m/%Y', b.birthday, 'unixepoch') AS birthday,
                  b.sex,
                  b.job,
                  b.province_code,
                  b.address,
                  (select max(name) from dm_muc_dich_goi_ra where id=a.last_muc_dich_goi_ra_id) last_muc_dich_goi_ra,
                  (select max(name) from dm_ket_qua_goi_ra where id=a.last_ket_qua_goi_ra_id) last_ket_qua_goi_ra
                FROM chien_dich_xe cdx, xe a , khach_hang b
                WHERE
                    cdx.chien_dich_id = ?
                    AND (? IS NULL OR cdx.cua_hang_id=?)
                    AND cdx.xe_id=a.id
                    AND a.count_callout_fail < 2
                    AND a.khach_hang_id=b.id
                ORDER BY a.last_call_date`

      let params = [chien_dich_id, userInfo.cua_hang_id, userInfo.cua_hang_id]

      db.getRsts(sql, params)
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
