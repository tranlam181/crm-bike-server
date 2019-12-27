"use strict"

const db = require('../../db/sqlite3/crm-hieu-nga-dao')

class Handler {

    reportCallout(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = `  SELECT   a.name as call_out_result, COALESCE (b.count_, 0) AS count_
                            FROM       dm_ket_qua_goi_ra a
                                LEFT OUTER JOIN
                                    (  SELECT   ket_qua_goi_ra_id, COUNT (1) AS count_
                                            FROM   goi_ra
                                        WHERE   (? IS NULL OR cua_hang_id=?)
                                                AND call_date >= strftime ('%s', ?)
                                                AND call_date < strftime ('%s', date (?, '+1 day'))
                                        GROUP BY   ket_qua_goi_ra_id) b
                                ON a.id = b.ket_qua_goi_ra_id
                        ORDER BY   a.order_`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            case 'detail':
                sql = `SELECT   (strftime ('%s', date ('now')) - c.last_visit_date) / 60 / 60 / 24 / 30.0 month_not_come,
                                (CASE
                                    WHEN c.last_visit_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                                    ELSE 'T.dong'
                                END)
                                    customer_type,
                                c.full_name,
                                (SELECT   MAX (name) FROM   dm_dia_ly WHERE       province_code = c.province_code AND district_code = c.district_code AND precinct_code = c.precinct_code) AS precinct,
                                (SELECT   MAX (name) FROM   dm_dia_ly WHERE   province_code = c.province_code AND district_code = c.district_code AND precinct_code = '') AS district,
                                c.phone,
                                d.name AS bike_name,
                                b.bike_number,
                                strftime ('%d/%m/%Y', a.call_date, 'unixepoch') AS call_date,
                                (SELECT   MAX (name) FROM   dm_muc_dich_goi_ra WHERE   id = a.muc_dich_goi_ra_id) AS call_out_purpose,
                                (SELECT   MAX (name) FROM   dm_ket_qua_goi_ra WHERE   id = a.ket_qua_goi_ra_id) AS call_out_result,
                                (SELECT   MAX (name) FROM   dm_y_kien_mua_xe WHERE   id = a.y_kien_mua_xe_id) AS buy_opinion,
                                a.note,
                                (SELECT   MAX (name) FROM   dm_cua_hang WHERE   id = c.cua_hang_id) AS shop_name
                        FROM    goi_ra a,
                                khach_hang_xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE   (? IS NULL OR a.cua_hang_id=?)
                                AND a.call_date >= strftime ('%s', ?)
                                AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                AND a.khach_hang_xe_id = b.id
                                AND b.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.id`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportAfterBuy(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = `  SELECT   a.name as feedback, COALESCE (b.count_, 0) AS count_
                            FROM       dm_ket_qua_goi_ra a
                                LEFT OUTER JOIN
                                    (  SELECT   y_kien_mua_xe_id, COUNT (1) AS count_
                                            FROM   xe
                                        WHERE   (? IS NULL OR cua_hang_id=?)
                                                AND feedback_date >= strftime ('%s', ?)
                                                AND feedback_date < strftime ('%s', date (?, '+1 day'))
                                        GROUP BY   y_kien_mua_xe_id) b
                                ON a.id = b.y_kien_mua_xe_id
                            WHERE a.muc_dich_goi_ra_id = 3
                        ORDER BY   a.id`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            case 'detail':
                sql = `SELECT   (strftime ('%s', date ('now')) - a.last_service_date) / 60 / 60 / 24 / 30.0 month_not_come,
                            (CASE
                                WHEN a.last_service_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                                ELSE 'T.dong'
                            END) customer_type,
                            b.full_name,
                            (SELECT   MAX (name)
                            FROM   dm_dia_ly
                            WHERE   province_code = b.province_code
                                AND district_code = b.district_code
                                AND precinct_code = '') AS district,
                            b.phone,
                            d.name AS bike_name,
                            a.bike_number,
                            strftime ('%d/%m/%Y', a.feedback_date, 'unixepoch') AS feedback_date,
                            (SELECT   MAX (name)
                            FROM   dm_ket_qua_goi_ra
                            WHERE  muc_dich_goi_ra_id=3
                                AND id = a.y_kien_mua_xe_id) AS feedback,
                            a.note_1 note,
                            (SELECT   MAX (name)
                            FROM   dm_cua_hang
                            WHERE   id = a.cua_hang_id) AS shop_name
                    FROM   xe a, khach_hang b, dm_loai_xe d
                    WHERE   (? IS NULL OR a.cua_hang_id=?)
                            AND a.feedback_date >= strftime ('%s', ?)
                            AND a.feedback_date < strftime ('%s', date (?, '+1 day'))
                            AND a.khach_hang_id = b.id
                            AND a.loai_xe_id = d.id
                    ORDER BY a.feedback_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportMaintance(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = `   SELECT   a.name AS maintance_name, COALESCE (b.count_, 0) AS count_
                            FROM       dm_kieu_bao_duong a
                                LEFT OUTER JOIN
                                    (  SELECT   kieu_bao_duong_id, COUNT (1) AS count_
                                            FROM   bao_duong
                                        WHERE   (? IS NULL OR cua_hang_id=?)
                                                    AND maintance_date >= strftime ('%s', ?)
                                                AND maintance_date < strftime ('%s', date (?, '+1 day'))
                                        GROUP BY   kieu_bao_duong_id) b
                                ON a.id = b.kieu_bao_duong_id
                        ORDER BY   a.id`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            case 'detail':
                sql = `SELECT   (strftime ('%s', date ('now')) - c.last_visit_date) / 60 / 60 / 24 / 30.0 month_not_come,
                                (CASE
                                    WHEN c.last_visit_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                                    ELSE 'T.dong'
                                END)
                                    customer_type,
                                c.full_name,
                                (SELECT   MAX (name) FROM dm_dia_ly WHERE province_code = c.province_code AND district_code = c.district_code AND precinct_code = c.precinct_code) AS precinct,
                                (SELECT   MAX (name) FROM dm_dia_ly WHERE province_code = c.province_code AND district_code = c.district_code AND precinct_code = '') AS district,
                                c.phone,
                                d.name AS bike_name,
                                b.bike_number,
                                strftime ('%d/%m/%Y', a.maintance_date, 'unixepoch') AS maintance_date,
                                (SELECT   MAX (name) FROM dm_kieu_bao_duong WHERE id = a.kieu_bao_duong_id) AS maintance_name,
                                a.price_wage,
                                a.price_equip,
                                a.maintance_detail,
                                (SELECT   MAX (name) FROM dm_cua_hang WHERE id = c.cua_hang_id) AS shop_name
                        FROM    bao_duong a,
                                khach_hang_xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE   (? IS NULL OR a.cua_hang_id=?)
                                AND a.maintance_date >= strftime ('%s', ?)
                                AND a.maintance_date < strftime ('%s', date (?, '+1 day'))
                                AND a.khach_hang_xe_id = b.id
                                AND b.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.maintance_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportAfterMaintance(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = ``
                params = []
                break;
            case 'detail':
                sql = `SELECT   (strftime ('%s', date ('now')) - b.last_service_date) / 60 / 60 / 24 / 30.0 month_not_come,
                                (CASE
                                    WHEN b.last_service_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                                    ELSE 'T.dong'
                                END) customer_type,
                                c.full_name,
                                (SELECT   MAX (name) FROM dm_dia_ly WHERE province_code = c.province_code AND district_code = c.district_code AND precinct_code = '') AS district,
                                c.phone,
                                d.name AS bike_name,
                                b.bike_number,
                                strftime ('%d/%m/%Y', a.service_date, 'unixepoch') AS maintance_date,
                                (SELECT   MAX (name) FROM dm_loai_bao_duong WHERE id = a.loai_bao_duong_id) AS maintance_name,
                                a.price_wage,
                                a.total_price,
                                (SELECT   MAX (name) FROM dm_cua_hang WHERE id = a.cua_hang_id) AS shop_name,
                                strftime ('%d/%m/%Y', a.call_date, 'unixepoch') AS feedback_date,
                                (SELECT   MAX (name) FROM dm_ket_qua_goi_ra WHERE muc_dich_goi_ra_id=2 AND id = a.y_kien_dich_vu_id) AS y_kien_dich_vu,
                                (SELECT   MAX (name) FROM dm_thai_do_nhan_vien WHERE id = a.thai_do_nhan_vien_id) AS thai_do_nhan_vien,
                                a.note AS feedback
                        FROM    dich_vu a,
                                xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE   (? IS NULL OR a.cua_hang_id=?)
                                AND a.call_date >= strftime ('%s', ?)
                                AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                AND a.xe_id = b.id
                                AND a.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.call_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    exportCustomer(req, res, next) {
        let type = req.query.type // active|passive|all xuat danh sach nhu the nao
        let userInfo = req.userInfo
        let params
        let sql = `SELECT   (strftime ('%s', date ('now')) - c.last_visit_date) / 60 / 60 / 24 / 30.0 month_not_come,
                    (CASE
                        WHEN c.last_visit_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                        ELSE 'T.dong'
                    END)
                        customer_type,
                    c.full_name,
                    (SELECT   MAX (name) FROM dm_dia_ly WHERE province_code = c.province_code AND district_code = c.district_code AND precinct_code = c.precinct_code) AS precinct,
                    (SELECT   MAX (name) FROM dm_dia_ly WHERE province_code = c.province_code AND district_code = c.district_code AND precinct_code = '') AS district,
                    c.phone,
                    (CASE WHEN c.sex = 1 THEN 'Nam' ELSE 'Nữ' END) AS sex,
                    d.name AS bike_name,
                    b.bike_number,
                    strftime ('%d/%m/%Y', coalesce(a.maintance_date, c.last_visit_date), 'unixepoch') AS maintance_date,
                    (SELECT   MAX (name) FROM dm_kieu_bao_duong WHERE id = a.kieu_bao_duong_id) AS maintance_name,
                    a.price_wage,
                    a.price_equip,
                    a.maintance_detail,
                    (SELECT   MAX (name) FROM dm_cua_hang WHERE id = c.cua_hang_id) AS shop_name,
                    (SELECT   MAX (name) FROM dm_y_kien_mua_xe WHERE id = b.y_kien_mua_xe_id) AS buy_feedback,
                    b.note,
                    a.feedback AS maintance_feedback
                FROM    khach_hang c,
                        khach_hang_xe b,
                        dm_loai_xe d
                        LEFT OUTER JOIN bao_duong a ON b.bao_duong_id = a.id`

        switch (type) {
            case 'active':
                sql += ` WHERE  (? IS NULL OR c.cua_hang_id=?)
                                AND strftime ('%s', date('now', '-6 month')) < c.last_visit_date
                                AND c.id=b.khach_hang_id
                                AND b.loai_xe_id = d.id
                        ORDER BY   c.last_visit_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'passive':
                sql += ` WHERE  (? IS NULL OR c.cua_hang_id=?)
                                AND (c.last_visit_date IS NULL OR strftime ('%s', date('now', '-6 month')) >= c.last_visit_date)
                                AND c.id=b.khach_hang_id
                                AND b.loai_xe_id = d.id
                        ORDER BY   c.last_visit_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'all':
                sql += ` WHERE  (? IS NULL OR c.cua_hang_id=?)
                                AND c.id=b.khach_hang_id
                                AND b.loai_xe_id = d.id
                        ORDER BY   c.last_visit_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            default:
                break;
        }

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