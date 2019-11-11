"use strict"

const db = require('../db/sqlite3/crm-dao')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtConfig = require('../jwt/jwt-config')

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
                        user_name,
                        password,
                        cua_hang_id,
                        (SELECT MAX(name) FROM dm_cua_hang WHERE id=user.cua_hang_id) AS shop_name,
                        link_3c
                    FROM user WHERE user_name = ?`
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

    async getLink3c(req, res, next) {
        let sql = `SELECT id, link_3c FROM user WHERE id = ?`
        let params = [req.userInfo.id]

        let userDB = await db.getRst(sql, params)

        if (!userDB || !userDB.id) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'NOK', msg:`User ${req.userInfo.id} không tồn tại`}))
            return
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({status:'OK', link_3c: userDB.link_3c}))
    }

    async saveLink3c(req, res, next) {
        let data = req.json_data

        let sql = `UPDATE user SET link_3c=? WHERE id = ?`
        let params = [data.link_3c, req.userInfo.id]

        db.runSql(sql, params).then(result => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:'Cập nhật link 3c thành công'}))
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        })
    }
}

module.exports = {
    Handler: new Handler()
}