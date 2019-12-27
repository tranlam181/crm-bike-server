
"use strict"

const router = require('express').Router();

// const tokenHandler = require('../utils/token-proxy');
const postHandler = require('../utils/post-handler');
const tokenUtil = require('../utils/token-util')

const authHandler = require('../handlers/crm-hieu-nga/auth-handler').Handler;

router.post('/login'
    , postHandler.jsonProcess
    , authHandler.login)

router.post('/register'
    , postHandler.jsonProcess
    , authHandler.register)

router.post('/logout'
    , tokenUtil.checkToken
    , authHandler.logout)

router.get('/users'
    , tokenUtil.checkToken
    , authHandler.getUsers
);
router.put('/users'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , authHandler.saveUsers
);

router.post('/refresh_token', (req, res, next) => {
    res.end(JSON.stringify({status: "OK"}))
})

//gui chuoi json nhan duoc len authen server nhan ket qua, tra lai user
// router.post('/authorize-token'
//             , postHandler.jsonProcess
//             , tokenHandler.getToken
//             , tokenHandler.verifyProxyToken
//             , tokenHandler.getVerifiedToken
//             );

module.exports = router;