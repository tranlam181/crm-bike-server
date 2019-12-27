"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const {capitalizeFirstLetter, removeVietnameseFromString} = require('../../utils/utils')
const STOP_PROMISE_CHAIN = "STOP_PROMISE_CHAIN"

var _updateBaoDuongSum = (bao_duong_id) => {
    let sql = `SELECT   SUM (CASE WHEN a.loai_bao_duong_id = 276 THEN price ELSE 0 END) AS price_wage,
                SUM (CASE WHEN a.loai_bao_duong_id <> 276 THEN price ELSE 0 END) AS price_equip,
                group_concat ( (CASE WHEN a.loai_bao_duong_id <> 276 THEN b.name ELSE NULL END)) AS maintance_detail
            FROM   bao_duong_chi_phi a, dm_loai_bao_duong b
            WHERE   a.bao_duong_id = ? AND a.loai_bao_duong_id = b.id
            GROUP BY   a.bao_duong_id`

    db.getRst(sql, [bao_duong_id]).then(data => {
        sql = `UPDATE   bao_duong
                SET   price_wage = ?, price_equip = ?, maintance_detail = ?
                WHERE   id = ?`
        let params = [data.price_wage, data.price_equip, data.maintance_detail, bao_duong_id]

        return db.runSql(sql, params)
    })
}

var _importBaoDuong = (maintance, userInfo) => {
    let total_price = maintance.details.reduce((result, e, idx) => {
        result += Number(e.price)
        return result
    }, 0)
    let sql = `INSERT INTO bao_duong (khach_hang_xe_id,
                cua_hang_id,
                kieu_bao_duong_id,
                maintance_date,
                total_price,
                update_user,
                create_datetime )
            VALUES (?,
                ?,
                ?,
                strftime('%s', ?),
                ?,
                ?,
                strftime('%s', datetime('now', 'localtime'))
            )`
    let params = [
        maintance.khach_hang_xe_id,
        maintance.shop_id,
        maintance.kieu_bao_duong_id,
        maintance.maintance_date,
        total_price,
        userInfo.id
    ]

    db.runSql(sql, params).then(bao_duong_res => {
        sql = `UPDATE khach_hang
                SET bao_duong_id = ?, last_maintance_date = strftime('%s', ?)
                WHERE id=?`
        params = [bao_duong_res.lastID, maintance.maintance_date, maintance.khach_hang_id]
        db.runSql(sql, params)

        // cap nhat id lan cuoi bao duong vao khach_hang_xe -> muc dich de bao cao cho nhanh
        sql = ` UPDATE khach_hang_xe
            SET bao_duong_id = ?
            WHERE id=?`
        params = [bao_duong_res.lastID, maintance.khach_hang_xe_id]
        db.runSql(sql, params)

        let placeholder = maintance.details.map((bao_duong, index) => '(?,?,?)').join(',')
        sql = 'INSERT INTO bao_duong_chi_phi (bao_duong_id, loai_bao_duong_id, price) VALUES ' + placeholder

        params = maintance.details.reduce((result, e, idx) => {
            result = [...result, bao_duong_res.lastID, e.loai_bao_duong.id, e.price]
            return result
        }, [])

        return db.runSql(sql, params).then(data => {
            _updateBaoDuongSum(bao_duong_res.lastID)
        })
    })
}

class Handler {
    addCustomer(req, res, next) {
        let customer = req.json_data
        customer.full_name_no_sign = capitalizeFirstLetter(removeVietnameseFromString(customer.full_name.trim()))
        customer.phone = customer.phone.trim()
        customer.province_code = customer.province_code ? customer.province_code : 'DNA'
        if (customer.sex && !Number(customer.sex)) {
            customer.sex = customer.sex.toUpperCase() == 'NAM' || customer.sex.toUpperCase() == '1' ? 1 : 0
        }

        // 1. check xem customer da ton tai chua, check theo [full_name, phone]
        let sql = `SELECT MAX(id) as khach_hang_id, COUNT(1) AS count
                    FROM khach_hang
                    WHERE phone=?`

        db.getRst(sql, [customer.phone]).then(async (row) => {
            if (row.count > 0) { // ton tai roi thi khong can them moi Khach hang
                return {khach_hang_id: row.khach_hang_id}
            } else { // chua ton tai thi them moi Khach hang, dong thoi them moi du lieu xe
                // Them moi Khach hang
                let sql = `INSERT INTO khach_hang
                        (
                            full_name,
                            phone,
                            phone_2,
                            birthday,
                            sex,
                            job,
                            province_code,
                            district_code,
                            precinct_code,
                            address,
                            full_name_no_sign
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            strftime('%s',?),
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )`
                let params = [
                    customer.full_name,
                    customer.phone,
                    customer.phone_2,
                    customer.birthday,
                    customer.sex,
                    customer.job,
                    customer.province_code,
                    customer.district_code,
                    customer.precinct_code,
                    customer.address,
                    customer.full_name_no_sign
                ]

                let result = await db.runSql(sql, params).then(result => result).catch(err => err)
                return result.hasOwnProperty('lastID') ? {khach_hang_id: result.lastID} : Promise.reject(result)
            }
        })
        .then(customerInfo => {
            // them du lieu xe
            let sql = `INSERT INTO xe
                (
                    cua_hang_id,
                    khach_hang_id,
                    loai_xe_id,
                    mau_xe_id,
                    frame_number,
                    engine_number,
                    bike_number,
                    buy_date,
                    warranty_number
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    strftime('%s',?),
                    ?
                ) ON CONFLICT(khach_hang_id, loai_xe_id, frame_number) DO UPDATE SET update_user=?, update_datetime = strftime('%s', datetime('now', 'localtime'))`
            let params = [
                customer.cua_hang_id,
                customerInfo.khach_hang_id,
                customer.loai_xe_id,
                customer.mau_xe_id,
                customer.frame_number,
                customer.engine_number,
                customer.bike_number,
                customer.buy_date,
                customer.warranty_number,
                req.userInfo.id
            ]
            if (customer.loai_xe_id) {
                return db.runSql(sql, params).then(result => {
                    // ton tai loai hinh bao duong thi thuc hien insert cac bang ghi lien quan
                    // if (customer.loai_bao_duong_id) {
                    //     let maintance = {
                    //         khach_hang_id: customerInfo.khach_hang_id,
                    //         khach_hang_xe_id: result.lastID,
                    //         kieu_bao_duong_id: customer.kieu_bao_duong_id,
                    //         shop_id: customer.shop_id,
                    //         maintance_date: customer.last_visit_date,
                    //         details: [
                    //             {loai_bao_duong:{id: 266}, price:customer.price_equip},
                    //             {loai_bao_duong:{id: 276}, price:customer.price}
                    //         ]
                    //     }
                    //     _importBaoDuong(maintance, req.userInfo)
                    // }

                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({status:'OK', msg:'Thêm xe thành công', count:result.changes, khach_hang_id:customerInfo.khach_hang_id}))
                })
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Thêm xe thành công', khach_hang_id:customerInfo.khach_hang_id}))
            }
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    async delCustomer(req, res, next) {
        let khach_hang_id = req.params.khach_hang_id

        //sqlite ON DELETE CASCADE khong hoat dong khi call tu nodejs?
        //chua hieu vi sao, nen bay gio phai delete thu cong
        let sql = `DELETE FROM dich_vu WHERE khach_hang_id=?`
        let params = [khach_hang_id]
        await db.runSql(sql, params)
        sql = `DELETE FROM goi_ra WHERE khach_hang_id=?`
        await db.runSql(sql, params)
        sql = `DELETE FROM xe WHERE khach_hang_id=?`
        await db.runSql(sql, params)
        sql = `DELETE FROM khach_hang WHERE id=?`

        return db.runSql(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:'Xóa Khách hàng thành công', count:result.changes}))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    getCustomers(req, res, next) {
        let filter = req.query.filter // birthday|coming loc danh sach gi
        let s = req.query.s ? removeVietnameseFromString(req.query.s) : null // chuoi tim kiem neu co
        let sql = ''
        let params = []
        let userInfo = req.userInfo

        if (!s || s=='undefined') s = ''

        sql = `SELECT
                a.id as xe_id,
                a.khach_hang_id,
                (SELECT MAX(name) FROM dm_cua_hang where id=a.cua_hang_id) AS shop_name,
                a.loai_xe_id,
                (SELECT MAX(name) FROM dm_loai_xe where id=a.loai_xe_id) AS bike_name,
                a.mau_xe_id,
                a.frame_number,
                a.engine_number,
                a.bike_number,
                strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,
                a.warranty_number,
                strftime ('%d/%m/%Y', a.last_call_date, 'unixepoch') AS last_call_date,
                b.full_name,
                b.phone,
                b.phone_2,
                strftime ('%d/%m/%Y', b.birthday, 'unixepoch') AS birthday,
                b.sex,
                b.job,
                b.province_code,
                b.address`

        switch (filter) {
            // AND a.buy_date <= strftime ('%s', date('now', '-10 day'))
            //             AND a.buy_date >= strftime ('%s', date('now', '-30 day'))
            case 'after10BuyDate':
                sql += ` FROM xe a , khach_hang b
                    WHERE a.y_kien_mua_xe_id IS NULL
                        AND (? IS NULL OR a.cua_hang_id=?)
                        AND a.khach_hang_id=b.id
                    ORDER BY a.buy_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'afterMaintanceDate':
                //     AND (  c.service_date <= strftime ('%s', date('now', '-7 day'))
                //     AND c.service_date >= strftime ('%s', date('now', '-17 day'))
                // )
                sql += `    ,c.id AS dich_vu_id
                            ,strftime ('%d/%m/%Y', c.service_date, 'unixepoch') AS service_date
                            ,(select max(name) from dm_loai_bao_duong where id=c.loai_bao_duong_id) loai_bao_duong
                            ,c.offer_1
                            ,c.total_price
                        FROM xe a, khach_hang b, dich_vu c
                        WHERE a.khach_hang_id=b.id
                            AND a.id=c.xe_id
                            AND c.y_kien_dich_vu_id IS NULL
                            AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY c.service_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'ktdk6':
                    // a.buy_date >= strftime ('%s', date('now', '-1000 day'))
                    // AND a.buy_date < strftime ('%s', date('now', '-998 day'))
                    // AND
                sql += ` , strftime('%d/%m/%Y', date(a.buy_date, 'unixepoch', '+1000 day')) AS invite_date
                    FROM xe a , khach_hang b
                    WHERE  (? IS NULL OR a.cua_hang_id=?)
                        AND (a.last_service_date IS NULL OR a.last_service_date < strftime('%s', date(a.buy_date, 'unixepoch', '+1000 day')))
                        AND a.khach_hang_id=b.id
                    ORDER BY a.buy_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'ktdk7':
                    // a.buy_date >= strftime ('%s', date('now', '-1185 day'))
                    // AND a.buy_date < strftime ('%s', date('now', '-1183 day'))
                    // AND
                sql += ` , strftime('%d/%m/%Y', date(a.buy_date, 'unixepoch', '+1185 day')) AS invite_date
                    FROM xe a , khach_hang b
                    WHERE  (? IS NULL OR a.cua_hang_id=?)
                        AND (a.last_service_date IS NULL OR a.last_service_date < strftime('%s', date(a.buy_date, 'unixepoch', '+1185 day')))
                        AND a.khach_hang_id=b.id
                    ORDER BY a.buy_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'birthday':
                sql += `,(select max(name) from dm_muc_dich_goi_ra where id=a.last_muc_dich_goi_ra_id) last_muc_dich_goi_ra
                        ,(select max(name) from dm_ket_qua_goi_ra where id=a.last_ket_qua_goi_ra_id AND muc_dich_goi_ra_id=a.last_muc_dich_goi_ra_id) last_ket_qua_goi_ra
                        ,(select max(name) from dm_loai_bao_duong where id=a.last_loai_bao_duong_id) last_loai_bao_duong
                        ,strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') AS last_service_date
                    FROM xe a , khach_hang b
                    WHERE  (? IS NULL OR a.cua_hang_id=?)
                        AND a.khach_hang_id=b.id
                        AND strftime ('%m', b.birthday, 'unixepoch') = strftime ('%m', 'now')
                    ORDER BY CAST (strftime ('%d', b.birthday, 'unixepoch') AS DECIMAL), b.full_name_no_sign`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'random':
                sql += `,(select max(name) from dm_muc_dich_goi_ra where id=a.last_muc_dich_goi_ra_id) last_muc_dich_goi_ra
                        ,(select max(name) from dm_ket_qua_goi_ra where id=a.last_ket_qua_goi_ra_id AND muc_dich_goi_ra_id=a.last_muc_dich_goi_ra_id) last_ket_qua_goi_ra
                        ,(select max(name) from dm_loai_bao_duong where id=a.last_loai_bao_duong_id) last_loai_bao_duong
                        ,strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') AS last_service_date
                FROM xe a , khach_hang b
                WHERE  (? IS NULL OR a.cua_hang_id=?)
                    AND a.khach_hang_id=b.id
                LIMIT 50
                OFFSET ABS(RANDOM()) % MAX((SELECT COUNT(*) FROM xe WHERE (? IS NULL OR cua_hang_id=?)), 1)`
                params = [userInfo.cua_hang_id,
                        userInfo.cua_hang_id,
                        userInfo.cua_hang_id,
                        userInfo.cua_hang_id]
                break;

            default:
                sql += `,(select max(name) from dm_muc_dich_goi_ra where id=a.last_muc_dich_goi_ra_id) last_muc_dich_goi_ra
                        ,(select max(name) from dm_ket_qua_goi_ra where id=a.last_ket_qua_goi_ra_id AND muc_dich_goi_ra_id=a.last_muc_dich_goi_ra_id) last_ket_qua_goi_ra
                        ,(select max(name) from dm_loai_bao_duong where id=a.last_loai_bao_duong_id) last_loai_bao_duong
                        ,strftime ('%d/%m/%Y', a.last_service_date, 'unixepoch') AS last_service_date
                    FROM xe a , khach_hang b
                    WHERE
                        a.khach_hang_id=b.id
                        AND (
                            ifnull(?,'') = ''
                            OR b.phone LIKE '%' || ? || '%'
                            OR b.full_name_no_sign LIKE '%' || UPPER(?) || '%'
                            OR a.bike_number LIKE '%' || UPPER(?) || '%'
                            OR a.warranty_number LIKE '%' || UPPER(?) || '%'
                        )
                    ORDER BY full_name_no_sign
                    LIMIT 30`
                params = [s, s, s, s, s]
        }

        db.getRsts(sql, params).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCustomer(req, res, next) {
        let khach_hang_id = req.params.khach_hang_id

        db.getRst(`SELECT id AS khach_hang_id,
                    full_name,
                    phone,
                    phone_2,
                    strftime ('%d/%m/%Y', birthday, 'unixepoch') AS birthday,
                    (SELECT MAX (name)
                        FROM dm_dia_ly
                        WHERE province_code = a.province_code AND district_code = '' AND precinct_code = '') AS province,
                    CASE sex WHEN 0 THEN 'Nữ' WHEN '1' THEN 'Nam' ELSE '' END AS sex,
                    job,
                    address
            FROM khach_hang a
            WHERE id=?`, [khach_hang_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBike(req, res, next) {
        let xe_id = req.params.xe_id

        db.getRst(`select
                    id as xe_id,
                    cua_hang_id,
                    khach_hang_id,
                    (SELECT MAX(name) FROM dm_cua_hang where id=xe.cua_hang_id) AS shop_name,
                    (SELECT MAX(name) FROM dm_loai_xe where id=xe.loai_xe_id) AS bike_name,
                    mau_xe_id,
                    frame_number,
                    engine_number,
                    bike_number,
                    strftime ('%d/%m/%Y', buy_date, 'unixepoch') AS buy_date,
                    warranty_number,
                    y_kien_mua_xe_id,
                    strftime ('%d/%m/%Y', last_call_date, 'unixepoch') AS call_date
            from xe
            where id=?`, [xe_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCustomerBikes(req, res, next) {
        let khach_hang_id = req.params.khach_hang_id

        db.getRsts("SELECT a.id,\
                            a.khach_hang_id,\
                            a.cua_hang_id,\
                            a.loai_xe_id,\
                            strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,\
                            a.bike_number,\
                            b.name AS shop_name,\
                            c.name AS bike_name,\
                            strftime ('%d/%m/%Y %H:%M', d.book_date, 'unixepoch') AS book_date,\
                            d.is_free,\
                            e.name as service_name\
                    FROM khach_hang_xe a,\
                        dm_cua_hang b,\
                        dm_loai_xe c\
                        LEFT OUTER JOIN (SELECT khach_hang_xe_id,\
                                                dich_vu_id,\
                                                book_date,\
                                                is_free\
                                        FROM lich_hen\
                                        WHERE status IS NULL and khach_hang_xe_id IN (SELECT id from khach_hang_xe WHERE khach_hang_id=?)) d\
                            ON a.id = d.khach_hang_xe_id\
                        LEFT OUTER JOIN dm_dich_vu e ON d.dich_vu_id = e.id\
                    WHERE a.khach_hang_id = ? AND a.cua_hang_id = b.id AND a.loai_xe_id = c.id\
                    ORDER BY d.book_date DESC", [khach_hang_id, khach_hang_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCustomerMaintances(req, res, next) {
        let khach_hang_id = req.params.khach_hang_id

        db.getRsts("  SELECT   strftime ('%d/%m/%Y', a.maintance_date, 'unixepoch') AS maintance_date,\
                            (select max(name) From dm_loai_xe where id=b.loai_xe_id) bike_name,\
                            (select max(name) from dm_kieu_bao_duong where id=a.kieu_bao_duong_id) as maintance_name,\
                            a.total_price,\
                            a.feedback,\
                            a.is_complain\
                    FROM   bao_duong a, khach_hang_xe b\
                    WHERE   a.khach_hang_xe_id IN (SELECT   id\
                                                    FROM   khach_hang_xe\
                                                    WHERE   khach_hang_id = ?)\
                            AND a.khach_hang_xe_id = b.id\
                    ORDER BY   a.maintance_date DESC\
                    LIMIT 5", [khach_hang_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCustomerBikeInfo(req, res, next) {
        let khach_hang_xe_id = req.params.khach_hang_xe_id

        db.getRst(`SELECT a.id,
                        a.bike_number,
                        b.full_name,
                        b.phone,
                        strftime ('%d/%m/%Y', b.birthday, 'unixepoch') AS birthday,
                        strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,
                        c.name AS bike_name,
                        (SELECT MAX (name) FROM dm_dich_vu WHERE id = d.dich_vu_id) AS service_name,
                        strftime ('%d/%m/%Y', d.book_date, 'unixepoch') AS book_date,
                        d.is_free
                FROM khach_hang_xe a,
                    khach_hang b,
                    dm_loai_xe c
                    LEFT OUTER JOIN (SELECT khach_hang_xe_id,
                                            dich_vu_id,
                                            book_date,
                                            is_free
                                    FROM lich_hen
                                    WHERE status IS NULL AND khach_hang_xe_id=?) d
                        ON a.id = d.khach_hang_xe_id
                WHERE a.id = ? AND a.khach_hang_id = b.id AND a.loai_xe_id = c.id`, [khach_hang_xe_id, khach_hang_xe_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCustomerMaintanceInfo(req, res, next) {
        let bao_duong_id = req.params.bao_duong_id

        db.getRst("SELECT a.id AS bao_duong_id,\
                    c.full_name,\
                    c.phone,\
                    d.name AS bike_name,\
                    strftime ('%d/%m/%Y', a.maintance_date, 'unixepoch') AS maintance_date\
                    ,(SELECT MAX(name) FROM DM_KIEU_BAO_DUONG WHERE id=a.kieu_bao_duong_id) AS maintance_name\
                    ,a.feedback\
            FROM bao_duong a,\
                khach_hang_xe b,\
                khach_hang c,\
                dm_loai_xe d\
            WHERE a.id = ? AND a.khach_hang_xe_id = b.id AND b.khach_hang_id = c.id AND b.loai_xe_id = d.id", [bao_duong_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getMaintanceDetails(req, res, next) {
        let bao_duong_id = req.params.bao_duong_id

        db.getRsts("SELECT b.name, a.price\
                    FROM bao_duong_chi_phi a, dm_loai_bao_duong b\
                    WHERE a.bao_duong_id = ? AND a.loai_bao_duong_id = b.id\
                    ORDER BY b.name_no_sign", [bao_duong_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    updateFeedbackAfterBuy(req, res, next) {
        let feedback = req.json_data
        let sql = `INSERT INTO goi_ra (
                        khach_hang_id,
                        xe_id,
                        muc_dich_goi_ra_id,
                        ket_qua_goi_ra_id,
                        note,
                        call_date,
                        update_user,
                        create_datetime)
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    strftime('%s', datetime('now', 'localtime')),
                    ?,
                    strftime('%s', datetime('now', 'localtime'))
                )`
        let params = [
            feedback.khach_hang_id,
            feedback.xe_id,
            3, // feedback.muc_dich_goi_ra_id,
            feedback.ket_qua_goi_ra_id, // feedback.ket_qua_goi_ra_id,
            feedback.note,
            req.userInfo.id
        ]

        db.runSql(sql, params).then(goi_ra => {
            sql = `update xe
                    SET y_kien_mua_xe_id=?,
                        feedback_date=strftime('%s', datetime('now', 'localtime')),
                        last_goi_ra_id=?,
                        last_muc_dich_goi_ra_id=?,
                        last_ket_qua_goi_ra_id=?,
                        note_1=?,
                        last_call_date=strftime('%s', datetime('now', 'localtime'))
                    WHERE id=?`
            params = [
                feedback.ket_qua_goi_ra_id,
                goi_ra.lastID,
                3,
                feedback.ket_qua_goi_ra_id,
                feedback.note,
                feedback.xe_id,
            ]
            return db.runSql(sql, params).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công', count:result.changes, id:result.lastID}))
            })
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    updateFeedbackAfterMaintance(req, res, next) {
        let feedback = req.json_data
        let sql = `INSERT INTO goi_ra (
                        khach_hang_id,
                        xe_id,
                        muc_dich_goi_ra_id,
                        ket_qua_goi_ra_id,
                        note,
                        call_date,
                        update_user,
                        create_datetime,
                        dich_vu_id)
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
                )`
        let params = [
            feedback.khach_hang_id,
            feedback.xe_id,
            2, // feedback.muc_dich_goi_ra_id,
            feedback.y_kien_dich_vu_id, // feedback.ket_qua_goi_ra_id,
            feedback.note,
            req.userInfo.id,
            feedback.dich_vu_id,
        ]

        db.runSql(sql, params).then(goi_ra => {
            sql = `update dich_vu
                    SET call_date=strftime('%s', datetime('now', 'localtime')),
                        y_kien_dich_vu_id=?,
                        thai_do_nhan_vien_id=?,
                        note=?
                    WHERE id=?`
            params = [
                feedback.y_kien_dich_vu_id,
                feedback.thai_do_nhan_vien_id,
                feedback.note,
                feedback.dich_vu_id,
            ]
            return db.runSql(sql, params).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công', count:result.changes, id:result.lastID}))
            })
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    addSchedule(req, res, next) {
        let bao_duong_id = req.params.bao_duong_id
        let schedule = req.json_data
        schedule.is_free = (schedule.is_free ? 1 : 0)
        schedule.book_date = schedule.book_date.replace('T',' ').replace('Z','')
        let sql = ''
        let params = []

        if (!schedule.book_date) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'NOK', message:'Bạn phải nhập ngày hẹn'}))
            throw new Error(STOP_PROMISE_CHAIN)
        } else {
            sql = `INSERT INTO lich_hen (khach_hang_xe_id,
                        dich_vu_id,
                        book_date,
                        is_free,
                        update_user,
                        create_datetime)
                    VALUES ((select max(khach_hang_xe_id) from bao_duong where id=?),
                    ?,
                    strftime('%s', ?),
                    ?,
                    ?,
                    strftime('%s', datetime('now', 'localtime')))`
            params = [
                bao_duong_id,
                schedule.dich_vu_id,
                schedule.book_date,
                schedule.is_free,
                req.userInfo.id
            ]

            db.runSql(sql, params).then(obj => {
                sql = `UPDATE khach_hang
                SET last_call_out_date = strftime ('%s', datetime ('now', 'localtime'))
                    , next_book_date = strftime ('%s', ?)
                    , goi_ra_id = NULL
                    , ket_qua_goi_ra_id = NULL,
                    , update_user = ?
                    , update_datetime = strftime('%s', datetime('now', 'localtime'))
                WHERE id = (SELECT MAX (khach_hang_id)
                            FROM khach_hang_xe
                            WHERE id = (SELECT MAX (khach_hang_xe_id)
                                        FROM bao_duong
                                        WHERE id = ?))`
                params = [
                    schedule.book_date,
                    req.userInfo.id,
                    bao_duong_id
                ]
                return db.runSql(sql, params).then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({status:'OK', msg:'Đặt lịch hẹn thành công', count:result.changes, id:result.lastID}))
                })
            })
            .catch(err => {
                res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
            })
        }
    }

    addCallout(req, res, next) {
        let callout = req.json_data

        let sql = `INSERT INTO goi_ra (
                            khach_hang_id,
                            xe_id,
                            muc_dich_goi_ra_id,
                            ket_qua_goi_ra_id,
                            note,
                            call_date,
                            update_user,
                            create_datetime)
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime')),
                        ?,
                        strftime('%s', datetime('now', 'localtime'))
                    )`
        let params = [
            callout.khach_hang_id,
            callout.xe_id,
            callout.muc_dich_goi_ra_id,
            callout.ket_qua_goi_ra_id,
            callout.note,
            req.userInfo.id
        ]

        db.runSql(sql, params).then(goi_ra => {
            sql = `update xe
                    SET last_goi_ra_id=?,
                        last_muc_dich_goi_ra_id=?,
                        last_ket_qua_goi_ra_id=?,
                        last_call_date=strftime('%s', datetime('now', 'localtime'))
                    WHERE id=?`
            params = [
                goi_ra.lastID,
                callout.muc_dich_goi_ra_id,
                callout.ket_qua_goi_ra_id,
                callout.xe_id,
            ]

            return db.runSql(sql, params).then(() => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả gọi ra thành công'}))
            })
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    addService(req, res, next) {
        let service = req.json_data
        let total_price = service.equips.reduce((result, e, idx) => {
            result += Number(e.price)
            return result
        }, 0)

        service.total_price = total_price + Number(service.price_wage)

        let sql = `INSERT INTO dich_vu (
                        khach_hang_id,
                        cua_hang_id,
                        loai_bao_duong_id,
                        xe_id,
                        service_date,
                        in_date,
                        out_date,
                        reception_staff,
                        repaire_staff_1,
                        repaire_staff_2,
                        check_staff,
                        customer_require,
                        is_keep_old_equip,
                        offer_1,
                        offer_2,
                        offer_3,
                        equips,
                        price_wage,
                        total_price
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime')),
                        strftime('%s', ?),
                        strftime('%s', ?),
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )`
        let params = [
            service.khach_hang_id,
            service.cua_hang_id,
            service.loai_bao_duong_id,
            service.xe_id,
            service.in_date,
            service.out_date,
            service.reception_staff,
            service.repaire_staff_1,
            service.repaire_staff_2,
            service.check_staff,
            service.customer_require,
            service.is_keep_old_equip,
            service.offer_1,
            service.offer_2,
            service.offer_3,
            JSON.stringify(service.equips),
            service.price_wage,
            service.total_price
        ]

        db.runSql(sql, params).then(async (dich_vu) => {
            sql = `UPDATE xe
                    SET last_dich_vu_id=?,
                        last_loai_bao_duong_id=?,
                        last_service_date=strftime('%s', datetime('now', 'localtime'))
                    WHERE id=?`

            await db.runSql(sql, [dich_vu.lastID, service.loai_bao_duong_id, service.xe_id])

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:'Lưu thông tin dịch vụ thành công'}))
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    getServices(req, res, next) {
        let xe_id = req.query.xe_id

        if (!xe_id || xe_id=='undefined') xe_id = ''

        db.getRsts(`select
                        loai_bao_duong_id,
                        (select max(name) from dm_loai_bao_duong where id=dich_vu.loai_bao_duong_id) as loai_bao_duong,
                        xe_id,
                        strftime ('%d/%m/%Y', service_date, 'unixepoch') AS service_date,
                        strftime ('%d/%m/%Y %H:%m', in_date, 'unixepoch') AS in_date,
                        strftime ('%d/%m/%Y %H:%m', out_date, 'unixepoch') AS out_date,
                        (select max(name) from dm_nhan_vien where id=dich_vu.reception_staff) as reception_staff,
                        (select max(name) from dm_nhan_vien where id=dich_vu.repaire_staff_1) as repaire_staff_1,
                        (select max(name) from dm_nhan_vien where id=dich_vu.repaire_staff_2) as repaire_staff_2,
                        (select max(name) from dm_nhan_vien where id=dich_vu.check_staff) as check_staff,
                        customer_require,
                        is_keep_old_equip,
                        offer_1,
                        offer_2,
                        offer_3,
                        equips,
                        price_wage,
                        total_price,
                        call_date,
                        y_kien_dich_vu_id
                    from  dich_vu where xe_id=?
                    order by service_date`,
                    [xe_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getService(req, res, next) {
        let dich_vu_id = req.params.dich_vu_id

        db.getRst(`select
                        loai_bao_duong_id,
                        (select max(name) from dm_loai_bao_duong where id=dich_vu.loai_bao_duong_id) as loai_bao_duong,
                        xe_id,
                        strftime ('%d/%m/%Y', service_date, 'unixepoch') AS service_date,
                        strftime ('%d/%m/%Y %H:%m', in_date, 'unixepoch') AS in_date,
                        strftime ('%d/%m/%Y %H:%m', out_date, 'unixepoch') AS out_date,
                        (select max(name) from dm_nhan_vien where id=dich_vu.reception_staff) as reception_staff,
                        (select max(name) from dm_nhan_vien where id=dich_vu.repaire_staff_1) as repaire_staff_1,
                        (select max(name) from dm_nhan_vien where id=dich_vu.repaire_staff_2) as repaire_staff_2,
                        (select max(name) from dm_nhan_vien where id=dich_vu.check_staff) as check_staff,
                        customer_require,
                        is_keep_old_equip,
                        offer_1,
                        offer_2,
                        offer_3,
                        equips,
                        price_wage,
                        total_price,
                        call_date,
                        y_kien_dich_vu_id
                    from  dich_vu where id=?`,
                    [dich_vu_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCallouts(req, res, next) {
        let xe_id = req.query.xe_id

        if (!xe_id || xe_id=='undefined') xe_id = ''

        db.getRsts(`select
                        (select max(name) from dm_muc_dich_goi_ra where id=goi_ra.muc_dich_goi_ra_id) muc_dich_goi_ra_id,
                        (select max(name) from dm_ket_qua_goi_ra where id=goi_ra.ket_qua_goi_ra_id AND muc_dich_goi_ra_id=goi_ra.muc_dich_goi_ra_id) ket_qua_goi_ra_id,
                        note,
                        strftime ('%d/%m/%Y', call_date, 'unixepoch') AS call_date,
                        (select max(user_name) from user where id=goi_ra.update_user) update_user
                    from  goi_ra
                    where xe_id=?
                    order by call_date`,
                    [xe_id]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }
}

module.exports = {
    Handler: new Handler()
};