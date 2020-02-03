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
                sql = `  SELECT   a.name as muc_dich_goi_ra, COALESCE (b.count_, 0) AS count_
                            FROM       dm_muc_dich_goi_ra a
                                LEFT OUTER JOIN
                                    (  SELECT   muc_dich_goi_ra_id, COUNT (1) AS count_
                                            FROM   goi_ra a, xe b
                                        WHERE
                                                a.call_date >= strftime ('%s', ?)
                                                AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                                AND a.xe_id=b.id
                                                AND (? IS NULL OR b.cua_hang_id=?)
                                        GROUP BY   muc_dich_goi_ra_id) b
                                ON a.id = b.muc_dich_goi_ra_id
                        ORDER BY   a.order_`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'detail':
                sql = `SELECT   (strftime ('%s', date ('now')) - b.last_service_date) / 60 / 60 / 24 / 30.0 month_not_come,
                                (CASE
                                    WHEN b.last_service_date >= strftime ('%s', date ('now', '-6 month')) THEN 'T.xuyen'
                                    ELSE 'T.dong'
                                END) customer_type,
                                c.full_name,
                                (SELECT   MAX (name) FROM   dm_dia_ly WHERE   province_code = c.province_code AND district_code = c.district_code AND precinct_code = '') AS district,
                                c.phone,
                                d.name AS bike_name,
                                b.bike_number,
                                strftime ('%d/%m/%Y', a.call_date, 'unixepoch') AS call_date,
                                (SELECT   MAX (name) FROM   dm_muc_dich_goi_ra WHERE   id = a.muc_dich_goi_ra_id) AS call_out_purpose,
                                (SELECT   MAX (name) FROM   dm_ket_qua_goi_ra WHERE muc_dich_goi_ra_id=a.muc_dich_goi_ra_id AND  id = a.ket_qua_goi_ra_id) AS call_out_result,
                                a.note,
                                (SELECT   MAX (name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                        FROM    goi_ra a,
                                xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE
                                a.call_date >= strftime ('%s', ?)
                                AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                AND a.xe_id = b.id
                                AND (? IS NULL OR b.cua_hang_id=?)
                                AND a.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.id`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
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

    reportSms(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = `   SELECT   type, COUNT(1) AS count_
                            FROM       sms_history
                            WHERE   (? IS NULL OR cua_hang_id=?)
                                        AND sms_datetime >= strftime ('%s', ?)
                                        AND sms_datetime < strftime ('%s', date (?, '+1 day'))
                        GROUP BY   type
                        ORDER BY   type`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
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
                                a.type,
                                a.type_detail,
                                a.content,
                                strftime ('%d/%m/%Y', a.sms_datetime, 'unixepoch') AS sms_datetime,
                                (SELECT   MAX (name) FROM dm_cua_hang WHERE id = b.cua_hang_id) AS shop_name
                        FROM    sms_history a,
                                xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE   (? IS NULL OR a.cua_hang_id=?)
                                AND a.sms_datetime >= strftime ('%s', ?)
                                AND a.sms_datetime < strftime ('%s', date (?, '+1 day'))
                                AND a.xe_id = b.id
                                AND a.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.sms_datetime`
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
        let type = req.query.type // passive|all xuat danh sach nhu the nao
        let loai_xe_id = req.query.loai_xe_id ? req.query.loai_xe_id : null
        let mau_xe_id = req.query.mau_xe_id ? req.query.mau_xe_id : null
        let quan_huyen_id = req.query.quan_huyen_id ? req.query.quan_huyen_id : null
        let sex = req.query.sex ? req.query.sex : null
        let nghe_nghiep_id = req.query.nghe_nghiep_id ? req.query.nghe_nghiep_id : null
        let userInfo = req.userInfo
        let params
        let sql = `SELECT
                        (strftime ('%s', date ('now')) - a.last_service_date) / 60 / 60 / 24 / 30.0 month_not_come,
                        a.warranty_number,
                        (select max(name) from dm_ma_loai_xe where id=a.ma_loai_xe_id) ma_loai_xe,
                        (select max(name) from dm_loai_xe where id=a.loai_xe_id) loai_xe,
                        (select max(name) from dm_mau_xe where id=a.mau_xe_id) mau_xe,
                        a.frame_number,
                        a.engine_number,
                        b.full_name,
                        b.address,
                        (select max(district) from dm_quan_huyen where id=b.quan_huyen_id) district,
                        (select max(province) from dm_quan_huyen where id=b.quan_huyen_id) province,
                        strftime ('%d/%m/%Y', b.birthday, 'unixepoch') as birthday,
                        (CASE WHEN b.sex = 1 THEN 'Nam' ELSE 'Nữ' END) AS sex,
                        (select max(name) from dm_nghe_nghiep where id=b.nghe_nghiep_id) nghe_nghiep,
                        b.phone_2,
                        b.phone,
                        strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') as buy_date,
                        a.bike_number,
                        (select max(name) from dm_ket_qua_goi_ra where id=a.y_kien_mua_xe_id) y_kien_mua_xe,
                        a.note_1,
                        (select max(name) from dm_yeu_cau where id=a.last_yeu_cau_id) last_yeu_cau,
                        strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') as last_service_date`
        switch (type) {
            case 'passive':
                sql += ` FROM   xe a, khach_hang b
                        WHERE
                            (? IS NULL OR a.cua_hang_id=?)
                            AND a.last_service_date < strftime ('%s', date('now', '-6 month'))
                            AND a.khach_hang_id = b.id
                            ORDER BY a.last_service_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'all':
                sql += ` FROM   xe a, khach_hang b
                        WHERE
                            (? IS NULL OR a.cua_hang_id=?)
                            AND a.khach_hang_id = b.id
                            ORDER BY a.last_service_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'birthday':
                sql += ` FROM   xe a, khach_hang b
                        WHERE
                            (? IS NULL OR a.cua_hang_id=?)
                            AND a.khach_hang_id = b.id
                            AND strftime ('%m', b.birthday, 'unixepoch') = strftime ('%m', 'now')
                            AND b.address IS NOT NULL AND b.address <>''
                            ORDER BY a.last_service_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'filter':
                sql += ` FROM   xe a, khach_hang b
                        WHERE
                            (? IS NULL OR a.cua_hang_id=?)
                            AND (? IS NULL OR a.loai_xe_id=?)
                            AND (? IS NULL OR a.mau_xe_id=?)
                            AND a.khach_hang_id = b.id
                            AND (? IS NULL OR b.quan_huyen_id IN (SELECT   id
                                                                    FROM   dm_quan_huyen
                                                                WHERE   province IN (SELECT   province
                                                                                        FROM   dm_quan_huyen
                                                                                        WHERE   id = ?)))
                            AND (? IS NULL OR b.sex=?)
                            AND (? IS NULL OR b.nghe_nghiep_id=?)
                            ORDER BY a.last_service_date`
                params = [
                    userInfo.cua_hang_id, userInfo.cua_hang_id,
                    loai_xe_id,loai_xe_id,
                    mau_xe_id,mau_xe_id,
                    quan_huyen_id,quan_huyen_id,
                    sex,sex,
                    nghe_nghiep_id,nghe_nghiep_id,
                ]
                break;
            default:
                sql = 'SELECT 1'
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