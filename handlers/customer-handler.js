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
const {capitalizeFirstLetter} = require('../utils/utils')

class Handler {
    addCustomer(req, res, next) {
        let customer = req.json_data
        customer.full_name = capitalizeFirstLetter(customer.full_name.trim())
        customer.phone = customer.phone.trim()

        // 1. check xem customer da ton tai chua, check theo [full_name, phone]
        let sql = 'SELECT MAX(id) as khach_hang_id, COUNT(1) AS count FROM khach_hang WHERE full_name=? AND phone=?'
        
        db.getRst(sql, [customer.full_name, customer.phone])
        .then(async (row) => {
            if (row.count > 0) { // ton tai roi thi khong can them moi Khach hang                
                return {khach_hang_id: row.khach_hang_id}
            } else { // chua ton tai thi them moi Khach hang, dong thoi them moi du lieu xe
                // Them moi Khach hang
                let sql = "INSERT INTO khach_hang (full_name, province_code, district_code, precinct_code, phone, birthday, sex) VALUES (?,?,?,?,?,strftime('%s',?),?)"
                let params = [customer.full_name, 
                    customer.province_code, 
                    customer.district_code, 
                    customer.precinct_code, 
                    customer.phone.trim(), 
                    customer.birthday, 
                    customer.sex
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
            return db.runSql(sql, params).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Thêm Khách hàng thành công', count:result.changes}))
            })
        })
        .catch(err => {
            console.log('Last catch:', err);            
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })  
    }

    getCustomers(req, res, next) {
        db.getRsts("SELECT id,\
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
            FROM khach_hang a"
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