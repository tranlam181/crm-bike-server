const jwt = require('jsonwebtoken')
const jwtConfig = require('../jwt/jwt-config')

var verifyToken = (token, secret) => {
    return new Promise((resolve, rej) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return rej(err)
            }
            resolve(decoded)
        })
    })
}

var checkToken = async (req, res, next) => {
    const token = req.headers['x-access-token'] || req.headers['authorization']

    if (token) {
        try {
            const decoded = await verifyToken(token, jwtConfig.secret)
            req.userInfo = decoded
            next()
        } catch(err) {
            return res.status(401).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    } else {
        return res.status(403).end(JSON.stringify({status: 'NOK', msg: 'No token founded'}))
    }
}

var checkRefreshToken = async (req, res, next) => {
    const refresh_token = req.headers['refresh_token']

    if (refresh_token) {
        try {
            const decoded = await verifyToken(refresh_token, jwtConfig.refreshSecret)
            req.userInfo = decoded
            next()
        } catch(err) {
            return res.status(403).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        }
    } else {
        return res.status(403).end(JSON.stringify({status: 'NOK', msg: 'No refresh_token founded'}))
    }
}

module.exports = {
    checkToken
}
