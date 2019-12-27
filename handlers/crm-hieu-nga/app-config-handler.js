"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const jwtConfig = require('../../jwt/jwt-config')
const jwt = require('jsonwebtoken')
const {removeVietnameseFromString} = require('../../utils/utils')

class Handler {
    getAppConfig(req, res, next) {
        db.getRsts(`SELECT *
            FROM app_config
            ORDER BY id`
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    async saveAppConfig(req, res, next) {
        let app_configs = req.json_data
        let sql = ''
        let params = []

        for (let app_config of app_configs) {
            sql = `UPDATE app_config
                    SET
                        value = ?,
                        update_datetime = strftime('%s', datetime('now', 'localtime')),
                        update_user = ?
                    WHERE
                        id = ?`
            params = [
                app_config.value,
                req.userInfo.id,
                app_config.id
            ]

            await db.runSql(sql, params)
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({status:'OK', msg:'Lưu cấu hình thành công'}))
    }
}

module.exports = {
    Handler: new Handler()
};
