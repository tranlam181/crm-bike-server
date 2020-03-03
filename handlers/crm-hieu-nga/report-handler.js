"use strict"

const db = require('../../db/sqlite3/crm-hieu-nga-dao')

var syncCalloutReportDaily = async (date_sta, date_end) => {
    try {
        let sql = ``
        let params = []
        let daily_reports

        // bao cao goi ra hang ngay
        sql = `SELECT   strftime ('%s', date (a.call_date, 'unixepoch')) report_date,
                        x.cua_hang_id,
                        COUNT (1) count_callout,
                        COUNT (CASE WHEN ket_qua_goi_ra_id NOT IN (9, 12) THEN 1 ELSE NULL END) count_callout_ok
                FROM   goi_ra a, xe x
                WHERE
                        a.call_date >= strftime('%s', ?)
                        AND a.call_date < strftime('%s', ?) + 1 * 24 * 60 * 60
                        AND a.xe_id = x.id
            GROUP BY   date (a.call_date, 'unixepoch'), x.cua_hang_id`
        params = [date_sta, date_end]

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
                        0,
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


var syncCallinReportDaily = async (date_sta, date_end) => {
    try {
        let sql = ``
        let params = []
        let daily_reports

        // bao cao goi ra hang ngay
        sql = `SELECT   strftime ('%s', date (a.call_datetime, 'unixepoch')) report_date,
                        x.cua_hang_id,
                        COUNT (1) count_callin
                FROM   goi_den a, xe x
                WHERE
                        a.call_datetime >= strftime('%s', ?) AND a.call_datetime < strftime('%s', ?) + 1 * 24 * 60 * 60
                        AND a.xe_id = x.id
            GROUP BY   date (a.call_datetime, 'unixepoch'), x.cua_hang_id`
        params = [date_sta, date_end]

        daily_reports = await db.getRsts(sql, params)

        for (let e of daily_reports) {
            await db.runSql(
                `INSERT INTO bao_cao_ngay
                    (
                        report_date,
                        cua_hang_id,
                        chien_dich_id,
                        count_callin
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        0,
                        ?
                    )
                    ON CONFLICT(report_date, cua_hang_id, chien_dich_id)
                    DO UPDATE SET
                        count_callin = ?`,
                [
                    e.report_date,
                    e.cua_hang_id,
                    e.count_callin,
                    e.count_callin
                ]
            )
        }

        return {"status": "OK", "msg": "Sync báo cáo thành công"}
    } catch (err) {
        throw err
    }
}

var syncSmsReportDaily = async (date_sta, date_end) => {
    try {
        let sql = ``
        let params = []
        let daily_reports

        // bao cao goi ra hang ngay
        sql = `SELECT   strftime ('%s', date (a.sms_datetime, 'unixepoch')) report_date,
                        x.cua_hang_id,
                        COUNT (1) count_sms
                FROM   sms_history a, xe x
                WHERE
                    a.sms_datetime >= strftime('%s', ?)
                    AND a.sms_datetime < strftime('%s', ?) + 1 * 24 * 60 * 60
                    AND a.xe_id = x.id
            GROUP BY   date (a.sms_datetime, 'unixepoch'), x.cua_hang_id`
        params = [date_sta, date_end]

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
                        0,
                        ?
                    )
                    ON CONFLICT(report_date, cua_hang_id, chien_dich_id)
                    DO UPDATE SET
                        count_sms = ?`,
                [
                    e.report_date,
                    e.cua_hang_id,
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

var syncServiceReportDaily = async (date_sta, date_end) => {
    try {
        let sql = ``
        let params = []
        let daily_reports

        // bao cao goi ra hang ngay
        sql = `SELECT   strftime ('%s', date (a.service_date, 'unixepoch')) report_date,
                        x.cua_hang_id,
                        COUNT (1) count_service,
                        SUM (total_price) sum_price
                FROM   dich_vu a, xe x
                WHERE       a.service_date >= strftime ('%s', ?)
                        AND a.service_date < strftime ('%s', ?) + 1 * 24 * 60 * 60
                        AND a.xe_id = x.id
                GROUP BY   date (a.service_date, 'unixepoch'), x.cua_hang_id`
        params = [date_sta, date_end]

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
                        0,
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

    reportCallout(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = `   SELECT    a.name AS muc_dich_goi_ra,
                                    dm_ket_qua_goi_ra.name AS ket_qua_goi_ra,
                                    COALESCE (b.count_, 0) AS count_
                            FROM    dm_muc_dich_goi_ra a
                            INNER JOIN
                                (  SELECT   muc_dich_goi_ra_id, ket_qua_goi_ra_id, COUNT (1) AS count_
                                        FROM   goi_ra a, xe b
                                    WHERE
                                            a.call_date >= strftime ('%s', ?)
                                            AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                            AND a.xe_id=b.id
                                            AND (? IS NULL OR b.cua_hang_id=?)
                                    GROUP BY   muc_dich_goi_ra_id, ket_qua_goi_ra_id) b
                                ON a.id = b.muc_dich_goi_ra_id
                            LEFT JOIN dm_ket_qua_goi_ra ON b.ket_qua_goi_ra_id = dm_ket_qua_goi_ra.id
                            ORDER BY   a.order_, dm_ket_qua_goi_ra.order_`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'detail':
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
                                a.call_date >= strftime ('%s', ?)
                                AND a.call_date < strftime ('%s', date (?, '+1 day'))
                                AND a.xe_id = b.id
                                AND (? IS NULL OR b.cua_hang_id=?)
                                AND a.khach_hang_id = c.id
                    ORDER BY   a.id`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
                sql = `   SELECT   a.sms_type_id,
                                    (SELECT   MAX (TYPE) FROM   sms_config WHERE   id = a.sms_type_id) type,
                                    COUNT(1) AS count_
                            FROM       sms_history a, xe x
                            WHERE
                                    a.sms_datetime >= strftime ('%s', ?)
                                    AND a.sms_datetime < strftime ('%s', date (?, '+1 day'))
                                    AND a.xe_id = x.id
                                    AND (? IS NULL OR x.cua_hang_id=?)
                        GROUP BY   a.sms_type_id
                        ORDER BY   a.sms_type_id`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            case 'detail':
                sql = `SELECT
                            c.full_name,
                            c.phone,
                            (select max(name) from dm_loai_xe where id=b.loai_xe_id) AS bike_name,
                            b.bike_number,
                            strftime ('%d/%m %H:%M', a.sms_datetime, 'unixepoch') AS sms_datetime,
                            (SELECT   MAX (TYPE) FROM   sms_config WHERE   id = a.sms_type_id) sms_type,
                            a.content,
                            (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                        FROM    sms_history a,
                                xe b,
                                khach_hang c
                        WHERE
                                a.sms_datetime >= strftime ('%s', ?)
                                AND a.sms_datetime < strftime ('%s', date (?, '+1 day'))
                                AND a.xe_id = b.id
                                AND (? IS NULL OR b.cua_hang_id=?)
                                AND a.khach_hang_id = c.id
                    ORDER BY   a.sms_datetime`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportService(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = ` SELECT a.name, b.count_, b.total_price
                        FROM  dm_tu_van a INNER JOIN
                            (SELECT   offer_1, COUNT(1) AS count_, SUM(total_price) total_price
                                FROM    dich_vu
                                WHERE   (? IS NULL OR cua_hang_id=?)
                                        AND service_date >= strftime ('%s', ?)
                                        AND service_date < strftime ('%s', date (?, '+1 day'))
                                GROUP BY   offer_1) b
                            ON a.id = b.offer_1
                        ORDER BY a.name`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            case 'detail':
                sql = `SELECT   a.bill_number,
                            b.bike_number,
                            (select max(name) from dm_loai_xe where id=b.loai_xe_id) loai_xe,
                            b.frame_number,
                            b.engine_number,
                            a.km_number,
                            c.full_name,
                            c.address,
                            (select max(district) from dm_quan_huyen where id=c.quan_huyen_id) district,
                            c.phone,
                            a.reception_staff,
                            (select max(name) from dm_nhan_vien where id=a.reception_staff) reception_staff,
                            (select max(name) from dm_nhan_vien where id=a.repaire_staff_1) repaire_staff_1,
                            (select max(name) from dm_nhan_vien where id=a.repaire_staff_2) repaire_staff_2,
                            (select max(name) from dm_nhan_vien where id=a.check_staff) check_staff,
                            strftime ('%d/%m/%Y', a.service_date, 'unixepoch') as service_date,
                            (select max(name) from dm_yeu_cau where id=a.yeu_cau_id) yeu_cau,
                            (select max(name) from dm_tu_van where id=a.offer_1) offer_1,
                            (select max(name) from dm_tu_van where id=a.offer_2) offer_2,
                            (select max(name) from dm_tu_van where id=a.offer_3) offer_3,
                            a.wage_price,
                            a.equip_price,
                            a.total_price,
                            a.is_keep_old_equip,
                            (select max(name) from dm_yeu_cau where id=a.next_yeu_cau_id) next_yeu_cau,
                            strftime ('%d/%m/%Y', a.call_date, 'unixepoch') as call_date,
                            (select max(name) from dm_ket_qua_goi_ra where id=a.y_kien_dich_vu_id) y_kien_dich_vu,
                            a.note,
                            (select max(name) from dm_thai_do_nhan_vien where id=a.thai_do_nhan_vien_id) thai_do_nhan_vien,
                            a.note_thai_do,
                            (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                    FROM   dich_vu a, xe b, khach_hang c
                    WHERE
                        (? IS NULL OR a.cua_hang_id=?)
                        AND a.service_date >= strftime ('%s', ?)
                        AND a.service_date < strftime ('%s', date (?, '+1 day'))
                        AND a.xe_id = b.id
                        AND b.khach_hang_id = c.id
                    ORDER BY   a.service_date`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportCallin(req, res, next) {
        let type = req.query.type // sum|detail bao cao tong hop hoac chi tiet
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
        let sql
        let params

        switch (type) {
            case 'sum':
                sql = ` SELECT 1`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id, date_sta, date_end]
                break;
            case 'detail':
                sql = `SELECT   c.full_name,
                            c.phone,
                            (select max(name) from dm_loai_xe where id=b.loai_xe_id) AS bike_name,
                            b.bike_number,
                            strftime ('%d/%m %H:%M', a.call_datetime, 'unixepoch') AS call_datetime,
                            a.content,
                            a.note,
                            (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = b.cua_hang_id) AS shop_name
                    FROM   goi_den a, xe b, khach_hang c
                    WHERE
                        a.call_datetime >= strftime ('%s', ?)
                        AND a.call_datetime < strftime ('%s', date (?, '+1 day'))
                        AND a.xe_id = b.id
                        AND (? IS NULL OR b.cua_hang_id=?)
                        AND a.khach_hang_id = c.id
                    ORDER BY   a.call_datetime`
                params = [date_sta, date_end, userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;
            default:
                break;
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    reportGeneral(req, res, next) {
        let cua_hang_id = req.query.cua_hang_id ? req.query.cua_hang_id : null
        let date_sta = req.query.date_sta
        let date_end = req.query.date_end
        let userInfo = req.userInfo
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
                WHERE   (? IS NULL OR a.cua_hang_id=?)
                        AND a.report_date >= strftime ('%s', ?)
                        AND a.report_date < strftime ('%s', date (?, '+1 day'))
            ORDER BY   a.cua_hang_id, a.report_date`
        params = [cua_hang_id, cua_hang_id, date_sta, date_end]


        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
                        strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') as last_service_date,
                        (SELECT   MAX (short_name) FROM   dm_cua_hang WHERE   id = a.cua_hang_id) AS shop_name`
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
                            ORDER BY strftime ('%d%m', b.birthday, 'unixepoch')`
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
                    loai_xe_id, loai_xe_id,
                    mau_xe_id, mau_xe_id,
                    quan_huyen_id, quan_huyen_id,
                    sex, sex,
                    nghe_nghiep_id, nghe_nghiep_id,
                ]
                break;
            default:
                sql = 'SELECT 1'
        }

        db.getRsts(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify(result))
        }).catch(err => {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    async syncReportDaily(req, res, next) {
        try {
            let date_sta = req.query.date_sta
            let date_end = req.query.date_end

            await syncCalloutReportDaily(date_sta, date_end)

            await syncCallinReportDaily(date_sta, date_end)

            await syncSmsReportDaily(date_sta, date_end)

            await syncServiceReportDaily(date_sta, date_end)

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify({"status": "OK", "msg": "Tổng hợp báo cáo thành công"}))
        } catch (err) {
            return res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    }
}

module.exports = {
    Handler: new Handler()
};
