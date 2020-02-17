"use strict";

const db = require("../../db/sqlite3/crm-hieu-nga-dao");
const { removeVietnameseFromString } = require("../../utils/utils");
const support = require("./support");


var syncCalloutReportDaily = async (chien_dich_id, date_sta, date_end) => {
  try {
      let sql = ``
      let params = []
      let daily_reports

      // bao cao goi ra hang ngay
      sql = `SELECT   strftime ('%s', date (a.call_date, 'unixepoch')) report_date,
                      x.cua_hang_id,
                      a.chien_dich_id,
                      COUNT (1) count_callout,
                      COUNT (CASE WHEN ket_qua_goi_ra_id NOT IN (9, 12) THEN 1 ELSE NULL END) count_callout_ok
              FROM   goi_ra a, xe x
              WHERE
                      a.chien_dich_id=?
                      AND a.call_date >= strftime('%s', ?)
                      AND a.call_date < strftime('%s', ?) + 1 * 24 * 60 * 60
                      AND a.xe_id = x.id
          GROUP BY   date (a.call_date, 'unixepoch'), x.cua_hang_id, a.chien_dich_id`
      params = [chien_dich_id, date_sta, date_end]

      daily_reports = await db.getRsts(sql, params)

      for (let e of daily_reports) {
          await db.runSql(
              `INSERT INTO bao_cao_ngay
                  (
                      report_date,
                      cua_hang_id,
                      chien_dich_id,
                      count_callout,
                      count_callout_ok
                  )
                  VALUES
                  (
                      ?,
                      ?,
                      ?,
                      ?,
                      ?
                  )
                  ON CONFLICT(report_date, cua_hang_id, chien_dich_id)
                  DO UPDATE SET
                      count_callout = ?,
                      count_callout_ok = ?`,
              [
                  e.report_date,
                  e.cua_hang_id,
                  e.chien_dich_id,
                  e.count_callout,
                  e.count_callout_ok,
                  e.count_callout,
                  e.count_callout_ok
              ]
          )
      }

      return {"status": "OK", "msg": "Sync báo cáo thành công"}
  } catch (err) {
      throw err
  }
}

var syncSmsReportDaily = async (chien_dich_id, date_sta, date_end) => {
  try {
      let sql = ``
      let params = []
      let daily_reports

      // bao cao goi ra hang ngay
      sql = `SELECT   strftime ('%s', date (a.sms_datetime, 'unixepoch')) report_date,
                      x.cua_hang_id,
                      a.chien_dich_id,
                      COUNT (1) count_sms
              FROM   sms_history a, xe x
              WHERE
                  a.chien_dich_id=?
                  AND a.sms_datetime >= strftime('%s', ?)
                  AND a.sms_datetime < strftime('%s', ?) + 1 * 24 * 60 * 60
                  AND a.xe_id = x.id
          GROUP BY   date (a.sms_datetime, 'unixepoch'), x.cua_hang_id, a.chien_dich_id`
      params = [chien_dich_id, date_sta, date_end]

      daily_reports = await db.getRsts(sql, params)

      for (let e of daily_reports) {
          await db.runSql(
              `INSERT INTO bao_cao_ngay
                  (
                      report_date,
                      cua_hang_id,
                      chien_dich_id,
                      count_sms
                  )
                  VALUES
                  (
                      ?,
                      ?,
                      ?,
                      ?
                  )
                  ON CONFLICT(report_date, cua_hang_id, chien_dich_id)
                  DO UPDATE SET
                      count_sms = ?`,
              [
                  e.report_date,
                  e.cua_hang_id,
                  e.chien_dich_id,
                  e.count_sms,
                  e.count_sms
              ]
          )
      }

      return {"status": "OK", "msg": "Sync báo cáo thành công"}
  } catch (err) {
      throw err
  }
}

var syncServiceReportDaily = async (chien_dich_id, date_sta, date_end) => {
  try {
      let sql = ``
      let params = []
      let daily_reports

      // bao cao goi ra hang ngay
      sql = `SELECT   strftime ('%s', date (a.service_date, 'unixepoch')) report_date,
                      x.cua_hang_id,
                      cx.chien_dich_id,
                      COUNT (1) count_service,
                      SUM (total_price) sum_price
              FROM   dich_vu a, xe x, (SELECT chien_dich_id, xe_id FROM chien_dich_xe WHERE chien_dich_id=?) cx
              WHERE       a.service_date >= strftime ('%s', ?)
                      AND a.service_date < strftime ('%s', ?) + 1 * 24 * 60 * 60
                      AND a.xe_id = x.id
                      AND a.xe_id = cx.xe_id
              GROUP BY   date (a.service_date, 'unixepoch'), x.cua_hang_id, cx.chien_dich_id`
      params = [chien_dich_id, date_sta, date_end]

      daily_reports = await db.getRsts(sql, params)

      for (let e of daily_reports) {
          await db.runSql(
              `INSERT INTO bao_cao_ngay
                  (
                      report_date,
                      cua_hang_id,
                      chien_dich_id,
                      count_service,
                      sum_price
                  )
                  VALUES
                  (
                      ?,
                      ?,
                      ?,
                      ?,
                      ?
                  )
                  ON CONFLICT(report_date, cua_hang_id, chien_dich_id)
                  DO UPDATE SET
                      count_service = ?,
                      sum_price = ?`,
              [
                  e.report_date,
                  e.cua_hang_id,
                  e.chien_dich_id,
                  e.count_service,
                  e.sum_price,
                  e.count_service,
                  e.sum_price,
              ]
          )
      }

      return {"status": "OK", "msg": "Sync báo cáo thành công"}
  } catch (err) {
      throw err
  }
}

class Handler {
  async addStrategy(req, res, next) {
    let strategy = req.json_data;

    let sql = `SELECT COUNT(1) count_row
                  FROM chien_dich
                  WHERE
                    name_no_sign=?
                    AND date_sta=strftime('%s', ?)
                    AND date_end=strftime('%s', ?)`;
    let params = [
      removeVietnameseFromString(strategy.name),
      strategy.date_sta,
      strategy.date_end
    ];

    let check_rs = await db.getRst(sql, params);

    if (check_rs.count_row > 0) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({ status: "NOK", msg: "Chiến dịch này đã tồn tại" })
      );
      return;
    }

    sql = `INSERT INTO chien_dich(
                      loai_chien_dich_id,
                      cua_hang_id,
                      name,
                      date_sta,
                      date_end,
                      name_no_sign
                    )
                    VALUES (
                      ?,
                      ?,
                      ?,
                      strftime('%s', ?),
                      strftime('%s', ?),
                      ?
                    )`;
    params = [
      strategy.loai_chien_dich_id,
      strategy.cua_hang_id,
      strategy.name,
      strategy.date_sta,
      strategy.date_end,
      removeVietnameseFromString(strategy.name)
    ];

    db.runSql(sql, params)
      .then(() => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(
          JSON.stringify({ status: "OK", msg: "Lưu chiến dịch thành công" })
        );
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  async addCallout(req, res, next) {
    let callout = req.json_data;
    let sql = `INSERT INTO goi_ra (
                      khach_hang_id,
                      xe_id,
                      muc_dich_goi_ra_id,
                      ket_qua_goi_ra_id,
                      note,
                      call_date,
                      update_user,
                      create_datetime,
                      chien_dich_id)
              VALUES (
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  strftime('%s', datetime('now', 'localtime')),
                  ?,
                  strftime('%s', datetime('now', 'localtime')),
                  ?
              )`;
    let params = [
      callout.khach_hang_id,
      callout.xe_id,
      callout.muc_dich_goi_ra_id,
      callout.ket_qua_goi_ra_id,
      callout.note,
      req.userInfo.id,
      callout.chien_dich_id
    ];

    db.runSql(sql, params)
      .then(goi_ra => {
        return support
          ._updateLastCallout4Bike(
            callout.xe_id,
            goi_ra.lastID,
            callout.muc_dich_goi_ra_id,
            callout.ket_qua_goi_ra_id,
            callout.note
          )
          .then(result => {
            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8"
            });
            res.end(
              JSON.stringify({ status: "OK", msg: "Lưu ý kiến KH thành công" })
            );
          });
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  getStrategies(req, res, next) {
    let userInfo = req.userInfo;

    let sql = `SELECT
                    id chien_dich_id,
                    (select max(name) from dm_loai_chien_dich where id=chien_dich.loai_chien_dich_id) loai_chien_dich,
                    (select max(short_name) from dm_cua_hang where id=chien_dich.cua_hang_id) shop_name,
                    name,
                    strftime ('%d/%m/%Y', date_sta, 'unixepoch') as date_sta ,
                    strftime ('%d/%m/%Y', date_end, 'unixepoch') as date_end
                    --(SELECT COUNT(1) FROM chien_dich_xe WHERE chien_dich_id=chien_dich.id) count_xe
                FROM chien_dich
                WHERE (? IS NULL OR cua_hang_id=?)
                ORDER BY date_sta`;

    db.getRsts(sql, [userInfo.cua_hang_id, userInfo.cua_hang_id])
      .then(row => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(row));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  getCalloutCustomers(req, res, next) {
    let chien_dich_id = req.params.chien_dich_id;
    let userInfo = req.userInfo;

    let sql = `SELECT
                  cdx.chien_dich_id,
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
                    AND cdx.xe_id=a.id
                    AND a.count_callout_fail < 2
                    AND a.khach_hang_id=b.id
                ORDER BY a.last_call_date`;

    let params = [chien_dich_id];

    db.getRsts(sql, params)
      .then(row => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(row));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  delStrategy(req, res, next) {
    let chien_dich_id = req.params.chien_dich_id;
    let sql = `DELETE FROM chien_dich_xe WHERE chien_dich_id=?`;

    db.runSql(sql, [chien_dich_id])
      .then(() => {
        sql = `DELETE FROM chien_dich WHERE id=?`;
        return db.runSql(sql, [chien_dich_id]);
      })
      .then(() => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(
          JSON.stringify({ status: "OK", msg: "Xóa chiến dịch thành công" })
        );
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  async importStrategyBike(req, res, next) {
    let customer = req.json_data;

    try {
      // console.log(customer);
      // Xu ly danh muc ma loai xe
      support._updateCategory("dm_ma_loai_xe", { name: customer.bike_code });
      // Xu ly danh muc loai xe
      support._updateCategory("dm_loai_xe", { name: customer.bike_name });
      // Xu ly danh muc mau xe
      support._updateCategory("dm_mau_xe", { name: customer.bike_color });
      // Xu ly danh muc quan,tp
      support._updateCategory("dm_quan_huyen", {
        province: customer.province,
        district: customer.district
      });
      // Xu ly nghe nghiep
      support._updateCategory("dm_nghe_nghiep", { name: customer.job });
      // Xu ly tinh trang xe
      support._updateCategory("dm_tinh_trang_xe", {
        name: customer.y_kien_mua_xe
      });

      // import khach hang
      let customer_result = await support._importCustomer(customer);
      // import xe
      let bike_result = await support._importBike(
        customer,
        customer_result.khach_hang_id
      );
      // import vao chien dich
      let strategy_bike_result = await support._importStrategyBike(
        customer.chien_dich_id,
        bike_result.xe_id
      );

      if (strategy_bike_result.status != "OK") {
        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(
          JSON.stringify({
            status: "NOK",
            msg: strategy_bike_result.msg,
            err: strategy_bike_result,
            stt: customer.A
          })
        );
      }

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ status: "OK", msg: "Thành công" }));
    } catch (err) {
      res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  }

  reportCallout(req, res, next) {
    let chien_dich_id = req.query.chien_dich_id;
    let type = req.query.type; // sum|detail bao cao tong hop hoac chi tiet
    let date_sta = req.query.date_sta;
    let date_end = req.query.date_end;
    let sql;
    let params;

    switch (type) {
      case "sum":
        sql = `   SELECT    a.name AS muc_dich_goi_ra,
                                dm_ket_qua_goi_ra.name AS ket_qua_goi_ra,
                                COALESCE (b.count_, 0) AS count_
                        FROM    dm_muc_dich_goi_ra a
                        INNER JOIN
                            (  SELECT   muc_dich_goi_ra_id, ket_qua_goi_ra_id, COUNT (1) AS count_
                                    FROM   goi_ra a, xe b
                                WHERE
                                        a.chien_dich_id=?
                                        AND a.call_date >= strftime ('%s', ?)
                                        AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                        AND a.xe_id=b.id
                                GROUP BY   muc_dich_goi_ra_id, ket_qua_goi_ra_id) b
                            ON a.id = b.muc_dich_goi_ra_id
                        LEFT JOIN dm_ket_qua_goi_ra ON b.ket_qua_goi_ra_id = dm_ket_qua_goi_ra.id
                        ORDER BY   a.order_, dm_ket_qua_goi_ra.order_`;
        params = [chien_dich_id, date_sta, date_end];
        break;
      case "detail":
        sql = `SELECT
                        c.full_name,
                        c.phone,
                        (select max(name) from dm_loai_xe where id=b.loai_xe_id) AS bike_name,
                        b.bike_number,
                        strftime ('%d/%m %H:%M', a.call_date, 'unixepoch') AS call_date,
                        (SELECT   MAX (name) FROM   dm_muc_dich_goi_ra WHERE id = a.muc_dich_goi_ra_id) AS muc_dich_goi_ra,
                        (SELECT   MAX (name) FROM   dm_ket_qua_goi_ra WHERE id = a.ket_qua_goi_ra_id) AS ket_qua_goi_ra,
                        a.note,
                        (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                FROM    goi_ra a,
                        xe b,
                        khach_hang c
                WHERE
                        a.chien_dich_id=?
                        AND a.call_date >= strftime ('%s', ?)
                        AND a.call_date < strftime ('%s', date (?, '+1 day'))
                        AND a.xe_id = b.id
                        AND a.khach_hang_id = c.id
            ORDER BY   a.id`;
        params = [chien_dich_id, date_sta, date_end];
        break;
      default:
        break;
    }

    db.getRsts(sql, params)
      .then(result => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  reportSms(req, res, next) {
    let chien_dich_id = req.query.chien_dich_id;
    let type = req.query.type; // sum|detail bao cao tong hop hoac chi tiet
    let date_sta = req.query.date_sta;
    let date_end = req.query.date_end;
    let userInfo = req.userInfo;
    let sql;
    let params;

    switch (type) {
      case "sum":
        sql = `   SELECT   b.type, COUNT(1) AS count_
                        FROM       sms_history a, sms_config b, xe x
                        WHERE
                                a.sms_datetime >= strftime ('%s', ?)
                                AND a.sms_datetime < strftime ('%s', date (?, '+1 day'))
                                AND a.sms_type_id = b.id
                                AND a.xe_id = x.id
                                AND (? IS NULL OR x.cua_hang_id=?)
                    GROUP BY   b.type
                    ORDER BY   b.id`;
        params = [
          date_sta,
          date_end,
          userInfo.cua_hang_id,
          userInfo.cua_hang_id
        ];
        break;
      case "detail":
        sql = `SELECT
                        c.full_name,
                        c.phone,
                        (select max(name) from dm_loai_xe where id=b.loai_xe_id) AS bike_name,
                        b.bike_number,
                        strftime ('%d/%m %H:%M', a.sms_datetime, 'unixepoch') AS sms_datetime,
                        a.content,
                        (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                    FROM    sms_history a,
                            xe b,
                            khach_hang c
                    WHERE
                            a.chien_dich_id=?
                            AND a.sms_datetime >= strftime ('%s', ?)
                            AND a.sms_datetime < strftime ('%s', date (?, '+1 day'))
                            AND a.xe_id = b.id
                            AND a.khach_hang_id = c.id
                ORDER BY   a.sms_datetime`;
        params = [chien_dich_id, date_sta, date_end];
        break;
      default:
        break;
    }

    db.getRsts(sql, params)
      .then(result => {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        res
          .status(400)
          .end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
  }

  async syncReportDaily(req, res, next) {
    try {
      let chien_dich_id = req.query.chien_dich_id;
      let date_sta = req.query.date_sta;
      let date_end = req.query.date_end;

      await syncCalloutReportDaily(chien_dich_id, date_sta, date_end);

      await syncSmsReportDaily(chien_dich_id, date_sta, date_end);

      await syncServiceReportDaily(chien_dich_id, date_sta, date_end);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({ status: "OK", msg: "Tổng hợp báo cáo thành công" })
      );
    } catch (err) {
      res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  }

  reportGeneral(req, res, next) {
    let chien_dich_id = req.query.chien_dich_id ? req.query.chien_dich_id : null
    let date_sta = req.query.date_sta
    let date_end = req.query.date_end
    let sql
    let params

    sql = `SELECT   strftime ('%d/%m/%Y', a.report_date, 'unixepoch') as report_date,
                    (SELECT   MAX (name) FROM dm_cua_hang WHERE id = a.cua_hang_id) AS shop_name,
                    a.count_callout,
                    a.count_callout_ok,
                    round((a.count_callout_ok * 100.0 / a.count_callout),2) count_callout_ok_percent,
                    a.count_callin,
                    a.count_sms,
                    a.count_service,
                    round((a.count_service * 100.0 / a.count_callout),2) count_service_percent,
                    a.sum_price
            FROM    bao_cao_ngay a
            WHERE   a.chien_dich_id=?
                    AND a.report_date >= strftime ('%s', ?)
                    AND a.report_date < strftime ('%s', date (?, '+1 day'))
        ORDER BY   a.cua_hang_id, a.report_date`
    params = [chien_dich_id, date_sta, date_end]


    db.getRsts(sql, params).then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(result))
    }).catch(err => {
        res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
    })
}
}

module.exports = {
  Handler: new Handler()
};
