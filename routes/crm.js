"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenHandler = require('../utils/token-proxy');

//test phan quyen kiem tra quyen, lay quyen
const categoryHandler = require("../handlers/category-handler").Handler;
const customerHanlder = require("../handlers/customer-handler").Handler;

router.get('/category/provinces'
    , categoryHandler.getProvinces
);
router.get('/category/districts/:province_code'
    , categoryHandler.getDistricts
);
router.get('/category/precincts/:province_code/:district_code'
    , categoryHandler.getPrecincts
);
router.get('/category/bike-types'
    , categoryHandler.getBikeTypes
);
router.get('/category/shops'
    , categoryHandler.getShops
);
router.post('/customers'
    , postHandler.jsonProcess
    , customerHanlder.addCustomer
);
router.get('/customers'
    , customerHanlder.getCustomers
);
router.get('/customers/:khach_hang_id'
    , customerHanlder.getCustomer
);
router.get('/customers/:khach_hang_id/bikes'
    , customerHanlder.getCustomerBikes
);

module.exports = router;