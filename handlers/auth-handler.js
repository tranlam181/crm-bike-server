"use strict"
const SQLiteDAO = require('../db/sqlite3/sqlite-dao');
const dbFile = './db/database/crm-bike.db';
const db = new SQLiteDAO(dbFile);
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
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:`User ${user.user_name} đã tồn tại rồi`}))
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
        let sql = `SELECT id, user_name, password, cua_hang_id FROM user WHERE user_name = ?`
        let params = [user.user_name]

        let userDB = await db.getRst(sql, params)

        if (!userDB || !userDB.id) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({status:'OK', msg:`User ${user.user_name} không tồn tại`}))
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
                res.end(JSON.stringify({status:'OK', msg:`User ${user.user_name} login thành công`, token: token}))
                return
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
                res.end(JSON.stringify({status:'OK', msg:`User ${user.user_name} mật khẩu không đúng`}))
                return
            }
        })
    }

    logout(req, res, next) {
        res.status(200).end(JSON.stringify({status:'OK', msg:`User ${req.user.user_name} logout thành công`}))
    }
}

module.exports = {
    Handler: new Handler()
}