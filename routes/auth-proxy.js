
"use strict"

const router = require('express').Router();

const tokenHandler = require('../utils/token-proxy');
const postHandler = require('../utils/post-handler');

//gui chuoi json nhan duoc len authen server nhan ket qua, tra lai user
router.post('/authorize-token'
            , postHandler.jsonProcess 
            , tokenHandler.getToken
            , tokenHandler.verifyProxyToken
            , tokenHandler.getVerifiedToken
            );

module.exports = router;