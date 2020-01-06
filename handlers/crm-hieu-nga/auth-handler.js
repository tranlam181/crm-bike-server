"use strict"

const db = require('../../db/sqlite3/crm-hieu-nga-dao')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtConfig = require('../../jwt/jwt-config')

class Handler {
    async register(req, res, next) {
        let user = req.json_data
        user.user_name = user.user_name.toUpperCase().trim()
        user.password = user.password.trim()

        let sql = `SELECT COUNT(1) AS count FROM user WHERE user_name = ?`
        let params = [user.user_name]

        let result = await db.getRst(sql, params)

        if (result.count >= 1) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'NOK', msg:`User ${user.user_name} đã tồn tại rồi`}))
            return
        }

        bcrypt.hash(user.password, 10, function (err, hash) {
            let sql = `INSERT INTO user (user_name, password, register_datetime) VALUES (?,?,strftime('%s', datetime('now', 'localtime')))`
            let params = [
                user.user_name,
                hash
            ]
            db.runSql(sql, params).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:'Đăng ký user thành công', count:result.changes}))
            })
            .catch(err => {
                res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
            })
        })
    }

    async login(req, res, next) {
        let user = req.json_data
        user.user_name = user.user_name.toUpperCase().trim()
        user.password = user.password.trim()
        let sql = `SELECT id,
                        nhom_id,
                        user_name,
                        password,
                        cua_hang_id,
                        (SELECT MAX(name) FROM dm_cua_hang WHERE id=user.cua_hang_id) AS shop_name,
                        link_3c,
                        ipphone
                    FROM user
                    WHERE user_name = ?`
        let params = [user.user_name]

        let userDB = await db.getRst(sql, params)

        if (!userDB || !userDB.id) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'NOK', msg:`User ${user.user_name} không tồn tại`}))
            return
        }

        // To check a password
        bcrypt.compare(user.password, userDB.password, function (err, result) {
            // res == true
            if (result) {
                // login thanh cong, return token
                // Loai bo password, nhay cam
                delete userDB.password

                const token = jwt.sign(userDB, jwtConfig.secret, {
                    expiresIn: jwtConfig.tokenLife
                })

                sql = `UPDATE user SET last_login_datetime = strftime('%s', datetime('now', 'localtime')) WHERE id=?`
                params = [userDB.id]
                db.getRst(sql, params)

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:`User ${user.user_name} login thành công`, token: token, user: userDB}))
                return
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'NOK', msg:`User ${user.user_name} mật khẩu không đúng`}))
                return
            }
        })
    }

    logout(req, res, next) {
        res.status(200).end(JSON.stringify({status:'OK', msg:`User ${req.user.user_name} logout thành công`}))
    }

    getUsers(req, res, next) {
        db.getRsts(`SELECT id, user_name, ipphone
            FROM user
            ORDER BY nhom_id, id`
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    async saveUsers(req, res, next) {
        let users = req.json_data
        let sql = ''
        let params = []
        let payload
        let token

        try {
            for (let user of users) {
                // generate token to call 3C
                sql = `SELECT (SELECT value FROM app_config WHERE id=4) AS link_call_3c,(SELECT value FROM app_config WHERE id=2) AS secret_3c`
                params = []
                let config = await db.getRst(sql, params)

                payload = {
                    "ipphone": user.ipphone,
                }
                token = jwt.sign(payload, config.secret_3c, {})

                sql = `UPDATE user
                        SET
                            link_3c = ?,
                            ipphone = ?,
                            update_user = ?,
                            update_datetime = strftime('%s', datetime('now', 'localtime'))
                        WHERE
                            id = ?`
                params = [
                    `${config.link_call_3c}?token=${token}&number=`,
                    user.ipphone,
                    req.userInfo.id,
                    user.id,
                ]

                await db.runSql(sql, params)
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:'Lưu cấu hình thành công'}))
        } catch(err) {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    }
}

module.exports = {
    Handler: new Handler()
}