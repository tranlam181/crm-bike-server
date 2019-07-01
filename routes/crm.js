"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenHandler = require('../utils/token-proxy');

//test phan quyen kiem tra quyen, lay quyen
const categoryHandler = require("../handlers/category-handler").Handler;

router.get('/category/provinces'
    , categoryHandler.getProvinces
);
router.get('/category/districts/:province_code'
    , categoryHandler.getDistricts
);
router.get('/category/precincts/:province_code/:district_code'
    , categoryHandler.getPrecincts
);

module.exports = router;