"use strict"
const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const {capitalizeFirstLetter, removeVietnameseFromString} = require('../../utils/utils')

const SUPPORT_PARAM = {
    KTDK1: 'KTDK LAN 1',
    KTDK2: 'KTDK LAN 2',
    KTDK3: 'KTDK LAN 3',
    KTDK4: 'KTDK LAN 4',
    KTDK5: 'KTDK LAN 5',
    KTDK6: 'KTDK LAN 6',
    KTDK7: 'KTDK LAN 7',
    BDTB: 'BDTB',
}

function _initNextKtdkDate() {
    let sql = ``
    let params = []
    let offer = SUPPORT_PARAM.KTDK1

    sql = `SELECT id FROM xe WHERE buy_date IS NOT NULL AND next_ktdk_date IS NULL`

    return db.getRsts(sql, params).then(bikes => {
        for (let bike of bikes) {
            db.runSql(
                `UPDATE xe
                SET
                    next_ktdk_date=strftime('%s', buy_date, 'unixepoch', '+'|| (select max(n_day_after) from sms_config where type=?) ||' day'),
                    next_ktdk_type=(select max(id) from sms_config where type=?)
                WHERE id=?`,
                [offer, offer, bike.id]
            )
        }
    }).catch(err => {
        return err
    })
}

/**
 * @categoryName: ten danh muc
 * @data: du lieu cua danh muc do, vd {code:xx, name:'xy}
 */
function _updateCategory(categoryName, data) {
    let sql
    let params

    switch (categoryName) {
        case 'dm_phu_tung':
            if (!data.name) return
            let phu_tung_arr = data.name.split(',')

            for (let e of phu_tung_arr) {
                e = e.trim().toUpperCase()
                if (e) {
                    sql = `INSERT OR IGNORE INTO dm_phu_tung (name) VALUES (?)`
                    params = [e]
                    db.runSql(sql, params).catch(err => {})
                }
            }
            return
        case 'dm_tu_van':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_tu_van (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_yeu_cau':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_yeu_cau (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_nhan_vien':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_nhan_vien (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_ma_loai_xe':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_ma_loai_xe (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_loai_xe':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_loai_xe (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_mau_xe':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_mau_xe (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_quan_huyen':
            if (!data.province || !data.district) return
            sql = `INSERT OR IGNORE INTO dm_quan_huyen (province, district) VALUES (?,?)`
            params = [data.province, data.district]
            break;
        case 'dm_nghe_nghiep':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_nghe_nghiep (name) VALUES (?)`
            params = [data.name]
            break;
        case 'dm_tinh_trang_xe':
            if (!data.name) return
            sql = `INSERT OR IGNORE INTO dm_ket_qua_goi_ra (is_mua_xe, name) VALUES (1, ?)`
            params = [data.name]
            break;
    }

    db.runSql(sql, params).catch(err => {})
}

async function _importCustomer(customer) {
    try {
        if (!customer.phone) {
            return {status:'NOK', msg: 'Khách hàng không có số điện thoại', is_error: true}
        }

        let sql = `SELECT MAX(id) as khach_hang_id FROM khach_hang WHERE phone=?`
        let params = [customer.phone]
        let result = await db.getRst(sql, params)

        if (result.khach_hang_id) {
            return {khach_hang_id: result.khach_hang_id, status:'NOK', msg: 'Đã tồn tại Khách hàng có số điện thoại ' + customer.phone}
        }

        sql = `INSERT INTO khach_hang
                (
                    full_name,
                    phone,
                    phone_2,
                    birthday,
                    sex,
                    nghe_nghiep_id,
                    quan_huyen_id,
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
                    (SELECT MAX(id) FROM dm_nghe_nghiep WHERE name=?),
                    (SELECT MAX(id) FROM dm_quan_huyen WHERE province=? AND district=?),
                    ?,
                    ?
                )`
        params = [
            customer.full_name,
            customer.phone,
            customer.phone_2,
            customer.birthday,
            customer.sex == 'NAM' || customer.sex == 'MALE' ? 1 : 0,
            customer.job,
            customer.province,
            customer.district,
            customer.address,
            capitalizeFirstLetter(removeVietnameseFromString(customer.full_name))
        ]

        result = await db.runSql(sql, params)
        return result.hasOwnProperty('lastID') ? {khach_hang_id: result.lastID, status:'OK'} : {status:'NOK', msg:'Lỗi khi thêm mới Khách hàng', error: result, is_error: true}
    } catch (err) {
        return {status:'NOK', msg:'Lỗi exception khi thêm mới Khách hàng', error: err, is_error: true}
    }
}

async function _importBike(bike, khach_hang_id) {
    try {
        if (!bike.frame_number && !bike.engine_number && !bike.bike_number) {
            return {status:'NOK', msg: 'Xe thiếu thông tin số khung, máy, biển số', is_error: true}
        }

        if (!khach_hang_id) {
            return {status:'NOK', msg: 'Xe thiếu thông tin Khách hàng', is_error: true}
        }

        let sql = `SELECT MAX(id) as xe_id
                FROM xe
                WHERE (frame_number IS NOT NULL AND frame_number <> '' AND frame_number=?)
                 OR (engine_number IS NOT NULL AND engine_number <> '' AND engine_number=?)
                 OR (bike_number IS NOT NULL AND bike_number <> '' AND bike_number=?)`
        let params = [bike.frame_number, bike.engine_number, bike.bike_number]
        let result = await db.getRst(sql, params)

        if (result.xe_id) {
            return {xe_id: result.xe_id, status:'NOK', msg: 'Đã tồn tại Xe có số khung, số máy, số xe ' + bike.frame_number + ', ' + bike.engine_number + ', ' + bike.bike_number}
        }

        sql = `INSERT INTO xe
            (
                cua_hang_id,
                khach_hang_id,
                ma_loai_xe_id,
                loai_xe_id,
                mau_xe_id,
                frame_number,
                engine_number,
                bike_number,
                buy_date,
                warranty_number,
                note_1,
                note_2,
                y_kien_mua_xe_id,
                feedback_date
            )
            VALUES
            (
                ?,
                ?,
                (SELECT MAX(id) FROM dm_ma_loai_xe WHERE name=?),
                (SELECT MAX(id) FROM dm_loai_xe WHERE name=?),
                (SELECT MAX(id) FROM dm_mau_xe WHERE name=?),
                ?,
                ?,
                ?,
                strftime('%s',?),
                ?,
                ?,
                ?,
                (SELECT MAX(id) FROM dm_ket_qua_goi_ra WHERE is_mua_xe=1 AND name=?),
                strftime('%s', ?)
            )`
        params = [
            bike.cua_hang_id,
            khach_hang_id,
            bike.bike_code,
            bike.bike_name,
            bike.bike_color,
            bike.frame_number,
            bike.engine_number,
            bike.bike_number,
            bike.buy_date,
            bike.warranty_number,
            bike.note_1,
            bike.note_2,
            bike.y_kien_mua_xe,
            bike.feedback_date
        ]

        result = await db.runSql(sql, params)

        if ( result.hasOwnProperty('lastID') ) {
            await _updateSmsSchedule(result.lastID)
            return {xe_id: result.lastID, status:'OK'}
        } else {
            return {status:'NOK', msg:'Lỗi khi thêm mới Xe', error: result, is_error: true}
        }
    } catch (err) {
        console.log(err);

        return {status:'NOK', msg:'Lỗi exception khi thêm mới Xe', error: err, is_error: true}
    }
}

async function _importService(service, khach_hang_id, xe_id) {
    try {
        let sql = `SELECT MAX(id) as dich_vu_id
                FROM dich_vu
                WHERE bill_number=?`
        let params = [service.bill_number]
        let result = await db.getRst(sql, params)

        if (result.dich_vu_id) {
            return {dich_vu_id: result.dich_vu_id, status:'NOK', msg: 'Đã import dịch vụ có Số phiêu ' + service.bill_number}
        }

        sql = `INSERT INTO dich_vu(
                    cua_hang_id,
                    khach_hang_id,
                    xe_id,
                    bill_number,
                    km_number,
                    service_date,
                    in_date,
                    out_date,
                    reception_staff,
                    repaire_staff_1,
                    repaire_staff_2,
                    check_staff,
                    yeu_cau_id,
                    is_keep_old_equip,
                    offer_1,
                    offer_2,
                    offer_3,
                    wage_price,
                    equip_price,
                    total_price,
                    next_yeu_cau_id
                    )
                VALUES(
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    strftime('%s', ?),
                    strftime('%s', ?),
                    strftime('%s', ?),
                    (SELECT MAX(id) FROM dm_nhan_vien WHERE name=?),
                    (SELECT MAX(id) FROM dm_nhan_vien WHERE name=?),
                    (SELECT MAX(id) FROM dm_nhan_vien WHERE name=?),
                    (SELECT MAX(id) FROM dm_nhan_vien WHERE name=?),
                    (SELECT MAX(id) FROM dm_yeu_cau WHERE name=?),
                    ?,
                    (SELECT MAX(id) FROM dm_tu_van WHERE name=?),
                    (SELECT MAX(id) FROM dm_tu_van WHERE name=?),
                    (SELECT MAX(id) FROM dm_tu_van WHERE name=?),
                    ?,
                    ?,
                    ?,
                    (SELECT MAX(id) FROM dm_yeu_cau WHERE name=?))`
        params = [
            service.cua_hang_id,
            khach_hang_id,
            xe_id,
            service.bill_number,
            service.km_number,
            service.out_date,
            service.in_date,
            service.out_date,
            service.reception_staff,
            service.repaire_staff_1,
            service.repaire_staff_2,
            service.check_staff,
            service.customer_require,
            service.is_keep_old_equip == 0 ? 0 : 1,
            service.offer_1,
            service.offer_2,
            service.offer_3,
            service.wage_price,
            service.equip_price,
            service.total_price,
            service.next_require
        ]

        result = await db.runSql(sql, params)
        return result.hasOwnProperty('lastID') ? {dich_vu_id: result.lastID, status:'OK'} : {status:'NOK', msg:'Lỗi khi import dịch vụ', error: result}
    } catch (err) {
        return {status:'NOK', msg:'Lỗi exception khi import dịch vụ', error: err}
    }
}

async function _importEquip(dich_vu_id, equips) {
    try {
        if (!equips) return

        let phu_tung_arr = equips.split(',')
        let sql
        let params

        for (let e of phu_tung_arr) {
            e = e.trim().toUpperCase()

            if (e) {
                sql = `INSERT OR IGNORE INTO phu_tung (dich_vu_id, phu_tung_id) VALUES (?, (SELECT MAX(id) FROM dm_phu_tung WHERE name=?))`
                params = [dich_vu_id, e]
                await db.runSql(sql, params).catch(err => {})
            }
        }
    } catch (err) {
        return {status:'NOK', msg:'Lỗi exception khi thêm mới Phụ tùng', error: err}
    }
}

async function _updateLastService4Bike(xe_id, dich_vu_id, customer_require, offer_1, out_date) {
    try {
        let offer = removeVietnameseFromString(offer_1)
        let next_offer

        switch (offer) {
            case SUPPORT_PARAM.KTDK1:
                next_offer = SUPPORT_PARAM.KTDK2
                break;
            case SUPPORT_PARAM.KTDK2:
                next_offer = SUPPORT_PARAM.KTDK3
                break;
            case SUPPORT_PARAM.KTDK3:
                next_offer = SUPPORT_PARAM.KTDK4
                break;
            case SUPPORT_PARAM.KTDK4:
                next_offer = SUPPORT_PARAM.KTDK5
                break;
            case SUPPORT_PARAM.KTDK5:
                next_offer = SUPPORT_PARAM.KTDK6
                break;
            case SUPPORT_PARAM.KTDK6:
                next_offer = SUPPORT_PARAM.KTDK7
                break;
            case SUPPORT_PARAM.KTDK7:
                next_offer = SUPPORT_PARAM.BDTB
                break;
            case SUPPORT_PARAM.BDTB:
                next_offer = ''
                break;
            default:
                next_offer = ''
                break;
        }

        let sql = `UPDATE xe
                    SET last_dich_vu_id=?,
                        last_yeu_cau_id=(SELECT MAX(id) FROM dm_yeu_cau WHERE name=?),
                        last_service_date=strftime('%s', ?),
                        last_ktdk_date=strftime('%s', ?),
                        last_ktdk_type=(SELECT MAX(id) FROM sms_config WHERE type=?),
                        next_ktdk_date=strftime('%s', buy_date, 'unixepoch', '+'|| (select max(n_day_after) from sms_config where type=?) ||' day'),
                        next_ktdk_type=(select max(id) from sms_config where type=?),
                        count_callout_fail = 0
                    WHERE id=?`
        let params = [
            dich_vu_id,
            customer_require,
            out_date,
            out_date,
            offer,
            next_offer,
            next_offer,
            xe_id
        ]

        return db.getRst(sql, params).then(() => _updateSmsSchedule(xe_id))
    } catch (err) {
        throw err
    }
}

async function _updateLastCallout4Bike(xe_id, goi_ra_id, muc_dich_goi_ra_id, ket_qua_goi_ra_id, note) {
    try {
        let sql = `update xe
                SET y_kien_mua_xe_id=?,
                    feedback_date=strftime('%s', datetime('now', 'localtime')),
                    last_goi_ra_id=?,
                    last_muc_dich_goi_ra_id=?,
                    last_ket_qua_goi_ra_id=?,
                    note_1=?,
                    last_call_date=strftime('%s', datetime('now', 'localtime')),
                    count_callout_fail = (
                        CASE WHEN 9 = ? THEN count_callout_fail + 1
                        ELSE 0 END
                    )
                WHERE id=?`
        let params = [
            ket_qua_goi_ra_id,
            goi_ra_id,
            muc_dich_goi_ra_id,
            ket_qua_goi_ra_id,
            note,
            Number(ket_qua_goi_ra_id),
            xe_id,
        ]

        return db.getRst(sql, params)
    } catch (err) {
        throw err
    }
}

function _updateSmsSchedule(xe_id) {
    let sql = ``
    let params = []

    sql = `SELECT   a.id AS xe_id,
                b.id AS sms_type_id,
                (CASE
                    WHEN b.TYPE LIKE 'KTDK%' OR b.TYPE = 'BDTB' OR b.TYPE = 'MUA XE'
                    THEN
                        strftime ('%s', date (a.buy_date, 'unixepoch', '+' || b.n_day_after || ' day'))
                    WHEN b.TYPE = 'SINH NHAT'
                    THEN
                        kh.birthday
                    WHEN b.TYPE = 'SAU 6 THANG DICH VU'
                    THEN
                        strftime ('%s', date (a.last_service_date, 'unixepoch', '+' || b.n_day_after || ' day'))
                    ELSE
                        NULL
                END)
                    sms_date_schedule
            FROM   xe a, khach_hang kh, sms_config b
            WHERE   a.id = ? AND a.khach_hang_id = kh.id`
    params = [xe_id]

    return db.getRsts(sql, params).then(async (sms_schedules) => {
        // console.log(sms_schedules);

        for (let e of sms_schedules) {
            await db.runSql(
                `INSERT INTO sms_schedule
                (
                    xe_id,
                    sms_type_id,
                    sms_date_schedule,
                    create_datetime
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    strftime('%s', datetime('now', 'localtime'))
                )
                ON CONFLICT(xe_id, sms_type_id)
                DO UPDATE SET
                    sms_date_schedule = ?,
                    update_datetime = strftime('%s', datetime('now', 'localtime'));`,
                [xe_id, e.sms_type_id, e.sms_date_schedule, e.sms_date_schedule]
            )
        }
    }).catch(err => {
        return err
    })
}

module.exports = {
    _updateCategory,
    _importCustomer,
    _importBike,
    _importService,
    _importEquip,
    _updateLastService4Bike,
    _initNextKtdkDate,
    _updateLastCallout4Bike,
    _updateSmsSchedule
}
