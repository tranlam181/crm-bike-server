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
router.get('/category/buy-opinions'
    , categoryHandler.getBuyOpinions
);
router.get('/category/call-results'
    , categoryHandler.getCallResults
);
router.get('/category/maintance-types'
    , categoryHandler.getMaintanceTypes
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
router.get('/customers-bikes/:khach_hang_xe_id'
    , customerHanlder.getCustomerBikeInfo
);
router.post('/customers-bikes/:khach_hang_xe_id/callouts'
    , postHandler.jsonProcess
    , customerHanlder.addCallout
);
router.post('/customers-bikes/:khach_hang_xe_id/maintances'
    , postHandler.jsonProcess
    , customerHanlder.addMaintance
);

module.exports = router;