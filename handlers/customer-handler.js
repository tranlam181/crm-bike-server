"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const SQLiteDAO = require('../db/sqlite3/sqlite-dao');
const dbFile = './db/database/crm-bike.db';
const db = new SQLiteDAO(dbFile);
const {capitalizeFirstLetter, removeVietnameseFromString} = require('../utils/utils')

class Handler {
    addCustomer(req, res, next) {
        let customer = req.json_data
        customer.full_name_no_sign = removeVietnameseFromString(customer.full_name).toUpperCase()
        customer.full_name = capitalizeFirstLetter(customer.full_name.trim())
        customer.phone = customer.phone.trim()

        // 1. check xem customer da ton tai chua, check theo [full_name, phone]
        let sql = 'SELECT MAX(id) as khach_hang_id, COUNT(1) AS count FROM khach_hang WHERE full_name_no_sign=? AND phone=?'

        db.getRst(sql, [customer.full_name_no_sign, customer.phone])
        .then(async (row) => {
            if (row.count > 0) { // ton tai roi thi khong can them moi Khach hang
                return {khach_hang_id: row.khach_hang_id}
            } else { // chua ton tai thi them moi Khach hang, dong thoi them moi du lieu xe
                // Them moi Khach hang
                let sql = "INSERT INTO khach_hang (full_name, province_code, district_code, precinct_code, phone, birthday, sex, full_name_no_sign, last_visit_date) VALUES (?,?,?,?,?,strftime('%s',?),?,?,strftime('%s',?))"
                let params = [customer.full_name,
                    customer.province_code,
                    customer.district_code,
                    customer.precinct_code,
                    customer.phone,
                    customer.birthday,
                    customer.sex,
                    customer.full_name_no_sign,
                    customer.buy_date,
                ]
                let result = await db.runSql(sql, params).then(result => result).catch(err => err)
                return result.hasOwnProperty('lastID') ? {khach_hang_id: result.lastID} : Promise.reject(result)
            }
        })
        .then(customerInfo => {
            // them du lieu xe
            let sql = "INSERT INTO khach_hang_xe (khach_hang_id, cua_hang_id, loai_xe_id, buy_date, bike_number) VALUES (?,?,?,strftime('%s',?),?)"
            let params = [
                customerInfo.khach_hang_id,
                customer.shop_id,
                customer.bike_type_id,
                customer.buy_date,
                customer.bike_number
            ]
            if (customer.bike_type_id) {
                return db.runSql(sql, params).then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                    res.end(JSON.stringify({status:'OK', msg:'Thêm Khách hàng thành công', count:result.changes, khach_hang_id:customerInfo.khach_hang_id}))
                })
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Thêm Khách hàng thành công', khach_hang_id:customerInfo.khach_hang_id}))
            }
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }

    getCustomers(req, res, next) {
        let filter = req.query.filter
        let s = req.query.s
        let sql = ''
        let params = []

        if (!s || s=='undefined') s = ''

        sql = "SELECT a.id,\
                full_name,\
                (SELECT MAX (name)\
                FROM dm_dia_ly\
                WHERE province_code = a.province_code AND district_code = '' AND precinct_code = '') AS province,\
                (SELECT MAX (name)\
                FROM dm_dia_ly\
                WHERE province_code = a.province_code AND district_code = a.district_code AND precinct_code = '') AS district,\
                (SELECT MAX (name)\
                FROM dm_dia_ly\
                WHERE province_code = a.province_code AND district_code = a.district_code AND precinct_code = a.precinct_code) AS precinct,\
                a.phone,\
                strftime ('%d/%m/%Y', a.birthday, 'unixepoch') AS birthday,\
                CASE a.sex WHEN 0 THEN 'Nữ' WHEN '1' THEN 'Nam' ELSE '' END AS sex,\
                strftime ('%d/%m/%Y', a.next_book_date, 'unixepoch') AS next_book_date,\
                strftime ('%d/%m/%Y', a.last_call_out_date, 'unixepoch') AS last_call_out_date,\
                strftime ('%d/%m/%Y', a.last_maintance_date, 'unixepoch') AS last_maintance_date,\
                strftime ('%d/%m/%Y', a.last_visit_date, 'unixepoch') AS last_visit_date"

        switch (filter) {
            case 'birthday':
                sql += " FROM khach_hang a\
                    WHERE	  strftime ('%m', birthday, 'unixepoch') = strftime ('%m', 'now')\
                    AND CAST (strftime ('%d', birthday, 'unixepoch') AS DECIMAL) >= CAST (strftime ('%d', 'now') AS DECIMAL)\
                    ORDER BY CAST (strftime ('%d', birthday, 'unixepoch') AS DECIMAL), full_name_no_sign"
                break;

            case 'coming':
                sql += " FROM khach_hang a\
                    WHERE (next_book_date - strftime ('%s', 'now')) / 60 / 60 / 24 <= 7\
                    ORDER BY a.next_book_date, full_name_no_sign\
                    LIMIT 20"
                break;

            case 'passive':
                sql += " FROM khach_hang a\
                    WHERE last_visit_date IS NULL OR (strftime ('%s', 'now') - last_visit_date) / 60 / 60 / 24 / 30 >= 6\
                    ORDER BY a.last_visit_date, full_name_no_sign\
                    LIMIT 20"
                break;

            case 'active':
                sql += " FROM khach_hang a\
                    WHERE (strftime ('%s', 'now') - last_visit_date) / 60 / 60 / 24 / 30 < 6\
                    ORDER BY a.last_visit_date, full_name_no_sign\
                    LIMIT 20"
                break;

            case 'after10BuyDate':
                sql += " ,strftime ('%d/%m/%Y', b.buy_date, 'unixepoch') AS buy_date\
                    , c.name as bike_name\
                    , b.id as khach_hang_xe_id\
                    FROM khach_hang a, khach_hang_xe b, dm_loai_xe c\
                    WHERE	  a.id = b.khach_hang_id\
                        AND b.y_kien_mua_xe_id IS NULL\
                        AND (strftime ('%s', 'now') - b.buy_date) / 60 / 60 / 24 >= 10\
                        AND b.loai_xe_id = c.id\
                    ORDER BY b.buy_date\
                    LIMIT 20"
                break;

            case 'after3MaintanceDate':
                sql += " , c.id as bao_duong_id\
                    FROM bao_duong c, khach_hang_xe b, khach_hang a\
                    WHERE	  (strftime ('%s', 'now') - c.maintance_date) / 60 / 60 / 24 >= 0\
                        AND c.feedback IS NULL\
                        AND c.khach_hang_xe_id = b.id\
                        AND b.khach_hang_id = a.id\
                    ORDER BY c.maintance_date\
                    LIMIT 20"
                break;

            default:
                sql += " FROM khach_hang a\
                    WHERE (ifnull(?,'') = '' OR phone LIKE '%' || ? || '%' OR full_name_no_sign LIKE '%' || UPPER(?) || '%' )\
                    ORDER BY full_name_no_sign\
                    LIMIT 20"
                params = [s, s, s]
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

        db.getRst("SELECT id,\
                    full_name,\
                    (SELECT MAX (name)\
                    FROM dm_dia_ly\
                    WHERE province_code = a.province_code AND district_code = '' AND precinct_code = '') AS province,\
                    (SELECT MAX (name)\
                    FROM dm_dia_ly\
                    WHERE province_code = a.province_code AND district_code = a.district_code AND precinct_code = '') AS district,\
                    (SELECT MAX (name)\
                    FROM dm_dia_ly\
                    WHERE province_code = a.province_code AND district_code = a.district_code AND precinct_code = a.precinct_code) AS precinct,\
                    phone,\
                    strftime ('%d/%m/%Y', birthday, 'unixepoch') AS birthday,\
                    CASE sex WHEN 0 THEN 'Nữ' WHEN '1' THEN 'Nam' ELSE '' END AS sex\
            FROM khach_hang a\
            WHERE id=?", [khach_hang_id]
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

    getCustomerBikeInfo(req, res, next) {
        let khach_hang_xe_id = req.params.khach_hang_xe_id

        db.getRst("SELECT a.id,\
                        b.full_name,\
                        b.phone,\
                        strftime ('%d/%m/%Y', b.birthday, 'unixepoch') AS birthday,\
                        strftime ('%d/%m/%Y', a.buy_date, 'unixepoch') AS buy_date,\
                        c.name AS bike_name,\
                        (SELECT MAX (name) FROM dm_dich_vu WHERE id = d.dich_vu_id) AS service_name,\
                        strftime ('%d/%m/%Y', d.book_date, 'unixepoch') AS book_date,\
                        d.is_free\
                FROM khach_hang_xe a,\
                    khach_hang b,\
                    dm_loai_xe c\
                    LEFT OUTER JOIN (SELECT khach_hang_xe_id,\
                                            dich_vu_id,\
                                            book_date,\
                                            is_free\
                                    FROM lich_hen\
                                    WHERE status IS NULL AND khach_hang_xe_id=?) d\
                        ON a.id = d.khach_hang_xe_id\
                WHERE a.id = ? AND a.khach_hang_id = b.id AND a.loai_xe_id = c.id", [khach_hang_xe_id, khach_hang_xe_id]
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

        let sql = "UPDATE khach_hang_xe \
                    SET bike_number=?\
                        , y_kien_mua_xe_id=?\
                        , feedback_date=strftime('%s', datetime('now', 'localtime'))\
                        , note=?\
                    WHERE id=?"
        let params = [
            feedback.bike_number,
            feedback.y_kien_mua_xe_id,
            feedback.note,
            khach_hang_xe_id
        ]

        db.runSql(sql, params).then(result => {
            // res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            // res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công', count:result.changes, id:result.lastID}))
            return "OK"
        }).then(msg => {
            if (!feedback.book_date) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu ý kiến KH thành công'}))
            } else {
                sql = "INSERT INTO lich_hen (khach_hang_xe_id,\
                            dich_vu_id,\
                            book_date,\
                            is_free)\
                        VALUES (?,\
                        ?,\
                        strftime('%s', ?),\
                        ?)"
                params = [
                    khach_hang_xe_id,
                    feedback.dich_vu_id,
                    feedback.book_date,
                    feedback.is_free
                ]

                return db.runSql(sql, params)
            }            
        }).then(obj => {
            sql = "UPDATE khach_hang\
                SET last_call_out_date = strftime('%s', datetime('now', 'localtime'))\
                    , next_book_date = strftime('%s', ?)\
                WHERE id = (select max(khach_hang_id) FROM khach_hang_xe where id=?)"
            params = [
                feedback.book_date,
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

        let sql = "UPDATE bao_duong \
                    SET feedback=?\
                        , feedback_date=strftime('%s', datetime('now', 'localtime'))\
                        , is_complain=?\
                    WHERE id=?"
        let params = [
            feedback.feedback,
            feedback.is_complain,
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
            } else {
                sql = "INSERT INTO lich_hen (khach_hang_xe_id,\
                            dich_vu_id,\
                            book_date,\
                            is_free)\
                        VALUES ((select max(khach_hang_xe_id) from bao_duong where id=?),\
                        ?,\
                        strftime('%s', ?),\
                        ?)"
                params = [
                    bao_duong_id,
                    feedback.dich_vu_id,
                    feedback.book_date,
                    feedback.is_free
                ]

                return db.runSql(sql, params)
            }            
        }).then(obj => {
            sql = "UPDATE khach_hang\
                    SET last_call_out_date = strftime ('%s', datetime ('now', 'localtime')), next_book_date = strftime ('%s', ?)\
                    WHERE id = (SELECT MAX (khach_hang_id)\
                                FROM khach_hang_xe\
                                WHERE id = (SELECT MAX (khach_hang_xe_id)\
                                            FROM bao_duong\
                                            WHERE id = ?))"
            params = [
                feedback.book_date,
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

    addCallout(req, res, next) {
        let khach_hang_xe_id = req.params.khach_hang_xe_id
        let callout = req.json_data
        callout.is_free = (callout.is_free ? 1 : 0)
        callout.book_date = callout.book_date.replace('T',' ').replace('Z','')

        let sql = "INSERT INTO goi_ra (khach_hang_xe_id,\
                        ket_qua_goi_ra_id,\
                        note,\
                        call_date)\
                    VALUES (?,\
                    ?,\
                    ?,\
                    strftime('%s', datetime('now', 'localtime')))"
        let params = [
            khach_hang_xe_id,
            callout.ket_qua_goi_ra_id,
            callout.note
        ]

        db.runSql(sql, params).then(result => {
            return result
        }).then(result => {
            sql = "update khach_hang set goi_ra_id_last=?, last_call_out_date=strftime('%s', datetime('now', 'localtime')) ,next_book_date=strftime('%s',?) where id=(select khach_hang_id from khach_hang_xe where id=?)"
            params = [result.lastID, callout.book_date, khach_hang_xe_id]

            return db.runSql(sql, params)//.then(result => {
                // res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                // res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả gọi ra thành công', count:result.changes, id:result.lastID}))
            // })
        }).then(data => {
            if (!callout.book_date) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả gọi ra thành công'}))
            } else {
                // Finish tat ca lich hen truoc do
                sql = "UPDATE lich_hen SET status=1, update_datetime=strftime('%s', datetime('now', 'localtime')) WHERE khach_hang_xe_id=? and book_date < strftime('%s', datetime('now', 'localtime'))"
                params = [khach_hang_xe_id]
                db.runSql(sql, params)

                sql = "INSERT INTO lich_hen (khach_hang_xe_id,\
                            dich_vu_id,\
                            book_date,\
                            is_free)\
                        VALUES (?,\
                        ?,\
                        strftime('%s', ?),\
                        ?)"
                params = [
                    khach_hang_xe_id,
                    callout.dich_vu_id,
                    callout.book_date,
                    callout.is_free
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
        let sql = "INSERT INTO bao_duong (khach_hang_xe_id,\
                        cua_hang_id,\
                        maintance_date)\
                    VALUES (?,\
                        ?,\
                        strftime('%s', datetime('now', 'localtime'))\
                    )"
        let params = [
            khach_hang_xe_id,
            maintance.shop_id
        ]

        db.runSql(sql, params).then(result => {
            return result
        }).then(async (result) => {
            // khi da thuc hien bao duong, thi cac lich hen truoc do coi nhu finished
            sql = "UPDATE lich_hen SET status=1, update_datetime=strftime('%s', datetime('now', 'localtime')) WHERE khach_hang_xe_id=? and book_date < strftime('%s', datetime('now', 'localtime'))"
            params = [khach_hang_xe_id]
            db.runSql(sql, params)

            sql = "update khach_hang\
                    set next_book_date = NULL,\
                    bao_duong_id_last=?,\
                    last_maintance_date=strftime('%s', datetime('now', 'localtime')),\
                    last_visit_date=strftime('%s', datetime('now', 'localtime'))\
                where id=(select max(khach_hang_id) from khach_hang_xe where id=?)"
            params = [result.lastID, khach_hang_xe_id]

            let updateResult = await db.runSql(sql, params)
            return updateResult.hasOwnProperty('lastID') ? result.lastID : Promise.reject(updateResult)
        }).then(bao_duong_id => {
            let placeholder =  maintance.details.map((bao_duong, index) => '(?,?,?)').join(',')
            sql = 'INSERT INTO bao_duong_chi_phi (bao_duong_id, loai_bao_duong_id, price) VALUES ' + placeholder

            params = maintance.details.reduce((result, e, idx) => {
                result = [...result, bao_duong_id, e.loai_bao_duong.id, e.price]
                return result
            }, [])

            console.log(params)

            return db.runSql(sql, params).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Lưu kết quả bảo dưỡng thành công', count:result.changes, id:result.lastID}))
            })
        })
        .catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }
}

module.exports = {
    Handler: new Handler()
};
