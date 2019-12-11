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
                )`
            let params = [
                customer.cua_hang_id,
                customerInfo.khach_hang_id,
                customer.loai_xe_id,
                customer.mau_xe_id,
                customer.frame_number,
                customer.engine_number,
                customer.bike_number,
                customer.buy_date,
                customer.warranty_number
            ]
            if (customer.loai_xe_id) {
                return db.runSql(sql, params).then(result => {
                    // ton tai loai hinh bao duong thi thuc hien insert cac bang ghi lien quan
                    if (customer.loai_bao_duong_id) {
                        let maintance = {
                            khach_hang_id: customerInfo.khach_hang_id,
                            khach_hang_xe_id: result.lastID,
                            kieu_bao_duong_id: customer.kieu_bao_duong_id,
                            shop_id: customer.shop_id,
                            maintance_date: customer.last_visit_date,
                            details: [
                                {loai_bao_duong:{id: 266}, price:customer.price_equip},
                                {loai_bao_duong:{id: 276}, price:customer.price}
                            ]
                        }
                        _importBaoDuong(maintance, req.userInfo)
                    }

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
        let sql = `DELETE FROM lich_hen WHERE khach_hang_xe_id IN (SELECT id FROM khach_hang_xe WHERE khach_hang_id=?)`
        let params = [khach_hang_id]
        await db.runSql(sql, params)
        sql = `DELETE FROM goi_ra WHERE khach_hang_xe_id IN (SELECT id FROM khach_hang_xe WHERE khach_hang_id=?)`
        await db.runSql(sql, params)
        sql = `DELETE FROM bao_duong_chi_phi WHERE bao_duong_id IN (SELECT id FROM bao_duong WHERE khach_hang_xe_id IN (SELECT id FROM khach_hang_xe WHERE khach_hang_id=?))`
        await db.runSql(sql, params)
        sql = `DELETE FROM bao_duong WHERE khach_hang_xe_id IN (SELECT id FROM khach_hang_xe WHERE khach_hang_id=?)`
        await db.runSql(sql, params)
        sql = `DELETE FROM khach_hang_xe WHERE khach_hang_id=?`
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
                strftime ('%d/%m/%Y', a.call_date, 'unixepoch') AS call_date,
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
                    WHERE
                        a.y_kien_mua_xe_id IS NULL

                        AND (? IS NULL OR a.cua_hang_id=?)
                        AND a.khach_hang_id=b.id
                    ORDER BY a.buy_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'after3MaintanceDate':
                sql += ` , c.id as bao_duong_id
                        , strftime ('%d/%m/%Y', c.maintance_date, 'unixepoch') AS maintance_date
                        , (select max(name) from dm_kieu_bao_duong where id=c.kieu_bao_duong_id) as maintance_name
                        , c.feedback
                        , c.is_complain
                        , (SELECT MAX(name) FROM dm_loai_xe WHERE id=b.loai_xe_id) AS bike_name
                    FROM bao_duong c, khach_hang_xe b, khach_hang a
                    WHERE
                        (
                            (  c.maintance_date <= strftime ('%s', date('now', '-3 day'))
                                AND c.maintance_date >= strftime ('%s', date('now', '-13 day'))
                                AND c.feedback IS NULL )
                            OR c.tracking_status = 1
                        )
                        AND c.khach_hang_xe_id = b.id
                        AND b.khach_hang_id = a.id
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY IFNULL(c.is_complain, 99), c.maintance_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'birthday':
                sql += ` ,(SELECT MAX(name) FROM dm_ket_qua_goi_ra WHERE id=a.ket_qua_goi_ra_id) as call_out_result
                        ,(SELECT MAX(name) FROM dm_muc_dich_goi_ra WHERE id=gr.muc_dich_goi_ra_id) as call_out_purpose
                    FROM khach_hang a LEFT OUTER JOIN goi_ra gr ON a.goi_ra_id = gr.id
                    WHERE	  strftime ('%m', birthday, 'unixepoch') = strftime ('%m', 'now')
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY CAST (strftime ('%d', birthday, 'unixepoch') AS DECIMAL), full_name_no_sign`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'coming':
                sql += ` ,(SELECT MAX(name) FROM dm_ket_qua_goi_ra WHERE id=a.ket_qua_goi_ra_id) as call_out_result
                        ,(SELECT MAX(name) FROM dm_muc_dich_goi_ra WHERE id=gr.muc_dich_goi_ra_id) as call_out_purpose
                    FROM khach_hang a LEFT OUTER JOIN goi_ra gr ON a.goi_ra_id = gr.id
                    WHERE next_book_date <= strftime('%s', date('now', '+10 day'))
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY a.next_book_date, full_name_no_sign
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'passive':
                sql += ` ,(SELECT MAX(name) FROM dm_ket_qua_goi_ra WHERE id=a.ket_qua_goi_ra_id) as call_out_result
                        ,(SELECT MAX(name) FROM dm_muc_dich_goi_ra WHERE id=gr.muc_dich_goi_ra_id) as call_out_purpose
                    FROM khach_hang a LEFT OUTER JOIN goi_ra gr ON a.goi_ra_id = gr.id
                    WHERE (last_visit_date IS NULL OR strftime ('%s', date('now', '-6 month')) >= last_visit_date)
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY (CASE
                        WHEN a.ket_qua_goi_ra_id IN (9, 3) AND strftime ('%s', date('now', '-3 day')) >= a.last_call_out_date THEN 1
                        WHEN a.ket_qua_goi_ra_id IS NULL THEN 2
                        ELSE 99
                    END), a.last_call_out_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            case 'active':
                sql += ` ,(SELECT MAX(name) FROM dm_ket_qua_goi_ra WHERE id=a.ket_qua_goi_ra_id) as call_out_result
                        ,(SELECT MAX(name) FROM dm_muc_dich_goi_ra WHERE id=gr.muc_dich_goi_ra_id) as call_out_purpose
                    FROM khach_hang a LEFT OUTER JOIN goi_ra gr ON a.goi_ra_id = gr.id
                    WHERE strftime ('%s', date('now', '-6 month')) < a.last_visit_date
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY
                        (CASE WHEN a.ket_qua_goi_ra_id IN (9, 3) AND strftime ('%s', date('now', '-3 day')) >= a.last_call_out_date THEN 1
                              --WHEN IFNULL(a.ket_qua_goi_ra_id, 0) NOT IN (9, 3) AND a.last_visit_date >= strftime ('%s', date('now', '-2 month', '-14 day')) AND a.last_visit_date <= strftime ('%s', date('now', '-2 month', '+7 day')) THEN 2
                              --WHEN a.last_call_out_date IS NULL AND a.last_visit_date < strftime ('%s', date('now', '-2 month', '-14 day')) THEN 3
                              WHEN a.last_call_out_date IS NULL THEN 4
                              ELSE 99
                        END), a.last_visit_date
                    LIMIT 30`
                params = [userInfo.cua_hang_id, userInfo.cua_hang_id]
                break;

            default:
                sql += ` ,(SELECT MAX(name) FROM dm_ket_qua_goi_ra WHERE id=a.ket_qua_goi_ra_id) as call_out_result
                        ,(SELECT MAX(name) FROM dm_muc_dich_goi_ra WHERE id=gr.muc_dich_goi_ra_id) as call_out_purpose
                    FROM khach_hang a LEFT OUTER JOIN goi_ra gr ON a.goi_ra_id = gr.id
                    WHERE (ifnull(?,'') = '' OR phone LIKE '%' || ? || '%' OR full_name_no_sign LIKE '%' || UPPER(?) || '%' )
                        AND (? IS NULL OR a.cua_hang_id=?)
                    ORDER BY full_name_no_sign
                    LIMIT 30`
                params = [s, s, s, userInfo.cua_hang_id, userInfo.cua_hang_id]
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
                    strftime ('%d/%m/%Y', birthday, 'unixepoch') AS birthday,
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
                    strftime ('%d/%m/%Y', call_date, 'unixepoch') AS call_date
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
        let khach_hang_xe_id = req.params.khach_hang_xe_id
        let feedback = req.json_data
        feedback.is_free = (feedback.is_free ? 1 : 0)
        feedback.book_date = feedback.book_date.replace('T',' ').replace('Z','')

        // ban than viec cap nhat y kien mua xe cung la goi ra
        // cho nen can bo sung 1 bang ghi goi ra voi ket_qua_goi_ra_id=13 :Xin y kien mua xe
        let sql = `INSERT INTO goi_ra (
                        khach_hang_xe_id,
                        cua_hang_id,
                        muc_dich_goi_ra_id,
                        ket_qua_goi_ra_id,
                        y_kien_mua_xe_id,
                        note,
                        call_date,
                        update_user,
                        create_datetime)
                VALUES (
                    ?,
                    (SELECT MAX(cua_hang_id) FROM khach_hang_xe WHERE id=?),
                    ?,
                    ?,
                    ?,
                    ?,
                    strftime('%s', datetime('now', 'localtime')),
                    ?,
                    strftime('%s', datetime('now', 'localtime'))
                )`
        let params = [
            khach_hang_xe_id,
            khach_hang_xe_id,
            feedback.muc_dich_goi_ra_id,
            13, // xin y kien mua xe
            feedback.y_kien_mua_xe_id,
            feedback.note,
            req.userInfo.id
        ]

        db.runSql(sql, params).then(goi_ra => {
            sql = `update khach_hang
                    SET goi_ra_id=?,
                        ket_qua_goi_ra_id=?,
                        last_call_out_date=strftime('%s', datetime('now', 'localtime')),
                        update_user=?,
                        update_datetime=strftime('%s', datetime('now', 'localtime'))
                    WHERE id=(select khach_hang_id from khach_hang_xe where id=?)`
            params = [goi_ra.lastID,
                13,
                req.userInfo.id,
                khach_hang_xe_id
            ]
            db.runSql(sql, params)

            sql = `UPDATE khach_hang_xe
                SET bike_number=?
                    , y_kien_mua_xe_id=?
                    , feedback_date=strftime('%s', datetime('now', 'localtime'))
                    , note=?
                    , update_user=?
                    , update_datetime=strftime('%s', datetime('now', 'localtime'))
                    , goi_ra_id = ?
                    , call_out_date = strftime('%s', datetime('now', 'localtime'))
                WHERE id=?`
            params = [
                feedback.bike_number,
                feedback.y_kien_mua_xe_id,
                feedback.note,
                req.userInfo.id,
                goi_ra.lastID,
                khach_hang_xe_id,
            ]

            return db.runSql(sql, params)
        }).then(result => {
            if (!feedback.book_date) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công'}))
                throw new Error(STOP_PROMISE_CHAIN)
            } else {
                sql = `INSERT INTO lich_hen (khach_hang_xe_id,
                            dich_vu_id,
                            book_date,
                            is_free,
                            update_user,
                            create_datetime)
                        VALUES (?,
                            ?,
                            strftime('%s', ?),
                            ?,
                            ?,
                            strftime('%s', datetime('now', 'localtime')))`
                params = [
                    khach_hang_xe_id,
                    feedback.dich_vu_id,
                    feedback.book_date,
                    feedback.is_free,
                    req.userInfo.id
                ]

                return db.runSql(sql, params)
            }
        }).then(lich_hen => {
            sql = `UPDATE khach_hang
                    SET last_call_out_date = strftime('%s', datetime('now', 'localtime'))
                    , next_book_date = strftime('%s', ?)
                    , ket_qua_goi_ra_id = 2 -- KH dat hen
                    , update_user = ?
                    , update_datetime = strftime('%s', datetime('now', 'localtime'))
                WHERE id = (select max(khach_hang_id) FROM khach_hang_xe where id=?)`
            params = [
                feedback.book_date,
                req.userInfo.id,
                khach_hang_xe_id
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
        let bao_duong_id = req.params.bao_duong_id
        let feedback = req.json_data
        feedback.is_complain = (feedback.is_complain ? 1 : 0)
        feedback.is_free = (feedback.is_free ? 1 : 0)
        feedback.book_date = feedback.book_date.replace('T',' ').replace('Z','')

        // ban than viec cap nhat y kien dich vu cung la goi ra
        // cho nen can bo sung 1 bang ghi goi ra voi ket_qua_goi_ra_id=14 :Xin y kien dich vu
        let sql = `INSERT INTO goi_ra (khach_hang_xe_id,
                cua_hang_id,
                muc_dich_goi_ra_id,
                ket_qua_goi_ra_id,
                note,
                call_date,
                update_user,
                create_datetime)
            VALUES ((SELECT MAX(khach_hang_xe_id) FROM bao_duong where id=?),
                (SELECT MAX(cua_hang_id) FROM bao_duong where id=?),
                ?,
                ?,
                ?,
                strftime('%s', datetime('now', 'localtime')),
                ?,
                strftime('%s', datetime('now', 'localtime')))`
        let params = [
            bao_duong_id,
            bao_duong_id,
            4, // muc dich: Hoi tham sau bao duong
            14, // Xin y kien bao duong
            feedback.feedback,
            req.userInfo.id
        ]
        db.runSql(sql, params)

        sql = `UPDATE bao_duong
                    SET  feedback=?
                        , feedback_date=strftime('%s', datetime('now', 'localtime'))
                        , is_complain=?
                        , tracking_status=${feedback.is_complain == 1 ? 1 : 0}
                        , update_user = ?
                        , update_datetime = strftime('%s', datetime('now', 'localtime'))
                    WHERE id=?`
        params = [
            feedback.feedback,
            feedback.is_complain,
            req.userInfo.id,
            bao_duong_id
        ]

        db.runSql(sql, params).then(result => {
            // res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            // res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công', count:result.changes, id:result.lastID}))
            return "OK"
        }).then(msg => {
            if (!feedback.book_date) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công'}))
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
                        strftime('%s', datetime('now', 'localtime')))`
                params = [
                    bao_duong_id,
                    feedback.dich_vu_id,
                    feedback.book_date,
                    feedback.is_free,
                    req.userInfo.id
                ]

                return db.runSql(sql, params)
            }
        }).then(obj => {
            sql = `UPDATE khach_hang
                    SET last_call_out_date = strftime ('%s', datetime ('now', 'localtime'))
                        , next_book_date = strftime ('%s', ?)
                        , goi_ra_id = NULL
                        , ket_qua_goi_ra_id = 2 -- KH dat hen
                        , update_user = ?
                        , update_datetime = strftime('%s', datetime('now', 'localtime'))
                    WHERE id = (SELECT MAX (khach_hang_id)
                                FROM khach_hang_xe
                                WHERE id = (SELECT MAX (khach_hang_xe_id)
                                            FROM bao_duong
                                            WHERE id = ?))`
            params = [
                feedback.book_date,
                req.userInfo.id,
                bao_duong_id
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
        let khach_hang_xe_id = req.params.khach_hang_xe_id
        let callout = req.json_data
        callout.is_free = (callout.is_free ? 1 : 0)
        callout.book_date = callout.book_date.replace('T',' ').replace('Z','')

        let sql = `INSERT INTO goi_ra (khach_hang_xe_id,
                        cua_hang_id,
                        muc_dich_goi_ra_id,
                        ket_qua_goi_ra_id,
                        note,
                        call_date,
                        update_user,
                        create_datetime)
                    VALUES (?,
                        (SELECT MAX(cua_hang_id) FROM khach_hang_xe WHERE id=?),
                        ?,
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime')),
                        ?,
                        strftime('%s', datetime('now', 'localtime')))`
        let params = [
            khach_hang_xe_id,
            khach_hang_xe_id,
            callout.muc_dich_goi_ra_id,
            callout.ket_qua_goi_ra_id,
            callout.note,
            req.userInfo.id
        ]

        db.runSql(sql, params).then(goi_ra_result => {
            // cap nhat id lan cuoi goi ra vao khach_hang_xe -> muc dich de bao cao cho nhanh
            sql = ` UPDATE khach_hang_xe
                    SET goi_ra_id = ?,
                        call_out_date = strftime('%s', datetime('now', 'localtime'))
                    WHERE id = ?`
            params = [goi_ra_result.lastID, khach_hang_xe_id]
            db.runSql(sql, params)

            sql = `update khach_hang
                    SET goi_ra_id=?,
                        ket_qua_goi_ra_id=?,
                        last_call_out_date=strftime('%s', datetime('now', 'localtime')),
                        next_book_date=strftime('%s',?),
                        update_user=?,
                        update_datetime=strftime('%s', datetime('now', 'localtime'))
                    WHERE id=(select khach_hang_id from khach_hang_xe where id=?)`
            params = [goi_ra_result.lastID,
                callout.ket_qua_goi_ra_id,
                callout.book_date,
                req.userInfo.id,
                khach_hang_xe_id
            ]

            return db.runSql(sql, params)
        }).then(data => {
            if (!callout.book_date) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả gọi ra thành công'}))
            } else {
                // Finish tat ca lich hen truoc do
                sql = `UPDATE lich_hen
                        SET status=1,
                            update_user=?,
                            update_datetime=strftime('%s', datetime('now', 'localtime'))
                    WHERE khach_hang_xe_id=? and book_date < strftime('%s', datetime('now', 'localtime'))`
                params = [req.userInfo.id, khach_hang_xe_id]
                db.runSql(sql, params)

                sql = `INSERT INTO lich_hen (khach_hang_xe_id,
                            dich_vu_id,
                            book_date,
                            is_free,
                            update_user,
                            create_datetime)
                        VALUES (?,
                        ?,
                        strftime('%s', ?),
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime')))`
                params = [
                    khach_hang_xe_id,
                    callout.dich_vu_id,
                    callout.book_date,
                    callout.is_free,
                    req.userInfo.id
                ]

                return db.runSql(sql, params).then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả gọi ra thành công', count:result.changes, id:result.lastID}))
                })
            }
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    addMaintance(req, res, next) {
        let khach_hang_xe_id = req.params.khach_hang_xe_id
        let maintance = req.json_data
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
                        (SELECT MAX(cua_hang_id) FROM khach_hang_xe WHERE id=?),
                        ?,
                        strftime('%s', datetime('now', 'localtime')),
                        ?,
                        ?,
                        strftime('%s', datetime('now', 'localtime'))
                    )`
        let params = [
            khach_hang_xe_id,
            khach_hang_xe_id,
            maintance.kieu_bao_duong_id,
            total_price,
            req.userInfo.id
        ]

        db.runSql(sql, params).then(async (result) => {
            // khi da thuc hien bao duong, thi cac lich hen truoc do coi nhu finished
            sql = `UPDATE lich_hen
                    SET status=1,
                        update_user=?,
                        update_datetime=strftime('%s', datetime('now', 'localtime'))
                    WHERE khach_hang_xe_id=? AND book_date < strftime('%s', datetime('now', 'localtime'))`
            params = [req.userInfo.id, khach_hang_xe_id]
            db.runSql(sql, params)
            // khi da thuc hien bao duong, thi cac tracking_status dich vu cac lan truoc coi nhu finished
            sql = ` UPDATE bao_duong
                    SET tracking_status = 0
                        ,update_user=?
                        ,update_datetime =strftime('%s', datetime('now', 'localtime'))
                    WHERE khach_hang_xe_id=? AND tracking_status = 1 AND id < ?`
            params = [req.userInfo.id, khach_hang_xe_id, result.lastID]
            db.runSql(sql, params)
            // cap nhat id lan cuoi bao duong vao khach_hang_xe -> muc dich de bao cao cho nhanh
            sql = ` UPDATE khach_hang_xe
                SET bao_duong_id = ?
                WHERE id=?`
            params = [result.lastID, khach_hang_xe_id]
            db.runSql(sql, params)

            sql = `update khach_hang
                    set next_book_date = NULL,
                    bao_duong_id=?,
                    last_maintance_date=strftime('%s', datetime('now', 'localtime')),
                    last_visit_date=strftime('%s', datetime('now', 'localtime')),
                    update_user=?,
                    update_datetime=strftime('%s', datetime('now', 'localtime'))
                where id=(select max(khach_hang_id) from khach_hang_xe where id=?)`
            params = [result.lastID, req.userInfo.id, khach_hang_xe_id]

            let updateResult = await db.runSql(sql, params)
            return updateResult.hasOwnProperty('lastID') ? result.lastID : Promise.reject(updateResult)
        }).then(bao_duong_id => {
            let placeholder = maintance.details.map((bao_duong, index) => '(?,?,?)').join(',')
            sql = 'INSERT INTO bao_duong_chi_phi (bao_duong_id, loai_bao_duong_id, price) VALUES ' + placeholder

            params = maintance.details.reduce((result, e, idx) => {
                result = [...result, bao_duong_id, e.loai_bao_duong.id, e.price]
                return result
            }, [])

            return db.runSql(sql, params).then(result => {
                _updateBaoDuongSum(bao_duong_id)
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả bảo dưỡng thành công', count:result.changes, id:result.lastID}))
            })
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

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
                            FROM       dm_y_kien_mua_xe a
                                LEFT OUTER JOIN
                                    (  SELECT   y_kien_mua_xe_id, COUNT (1) AS count_
                                            FROM   khach_hang_xe
                                        WHERE   (? IS NULL OR cua_hang_id=?)
                                                AND feedback_date >= strftime ('%s', ?)
                                                AND feedback_date < strftime ('%s', date (?, '+1 day'))
                                        GROUP BY   y_kien_mua_xe_id) b
                                ON a.id = b.y_kien_mua_xe_id
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
                            (SELECT   MAX (name)
                            FROM   dm_dia_ly
                            WHERE       province_code = c.province_code
                                    AND district_code = c.district_code
                                    AND precinct_code = c.precinct_code)
                                AS precinct,
                            (SELECT   MAX (name)
                            FROM   dm_dia_ly
                            WHERE   province_code = c.province_code AND district_code = c.district_code AND precinct_code = '')
                                AS district,
                            c.phone,
                            d.name AS bike_name,
                            b.bike_number,
                            strftime ('%d/%m/%Y', b.feedback_date, 'unixepoch') AS feedback_date,
                            (SELECT   MAX (name)
                            FROM   dm_y_kien_mua_xe
                            WHERE   id = b.y_kien_mua_xe_id)
                                AS feedback,
                            b.note,
                            (SELECT   MAX (user_name)
                            FROM   USER
                            WHERE   id = b.update_user)
                                AS user_name,
                            (SELECT   MAX (name)
                            FROM   dm_cua_hang
                            WHERE   id = c.cua_hang_id)
                                AS shop_name
                    FROM   khach_hang_xe b, khach_hang c, dm_loai_xe d
                    WHERE   (? IS NULL OR b.cua_hang_id=?)
                            AND b.feedback_date >= strftime ('%s', ?)
                            AND b.feedback_date < strftime ('%s', date (?, '+1 day'))
                            AND b.khach_hang_id = c.id AND b.loai_xe_id = d.id
                    ORDER BY b.feedback_date`
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
                                (SELECT   MAX (name) FROM dm_cua_hang WHERE id = c.cua_hang_id) AS shop_name,
                                strftime ('%d/%m/%Y', a.feedback_date, 'unixepoch') AS feedback_date,
                                a.feedback
                        FROM    bao_duong a,
                                khach_hang_xe b,
                                khach_hang c,
                                dm_loai_xe d
                        WHERE   (? IS NULL OR a.cua_hang_id=?)
                                AND a.feedback_date >= strftime ('%s', ?)
                                AND a.feedback_date < strftime ('%s', date (?, '+1 day'))
                                AND a.khach_hang_xe_id = b.id
                                AND b.khach_hang_id = c.id
                                AND b.loai_xe_id = d.id
                    ORDER BY   a.feedback_date`
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
