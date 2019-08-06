"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenUtil = require('../utils/token-util');

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
router.get('/category/kieu-bao-duongs'
    , categoryHandler.getKieuBaoDuongs
);
router.get('/category/service-types'
    , categoryHandler.getServiceTypes
);
router.post('/customers'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addCustomer
);
router.delete('/customers/:khach_hang_id'
    , tokenUtil.checkToken
    , customerHanlder.delCustomer
);
router.get('/customers'
    , tokenUtil.checkToken 
    , customerHanlder.getCustomers
);
router.get('/customers/:khach_hang_id'
    , tokenUtil.checkToken
    , customerHanlder.getCustomer
);
router.get('/customers/:khach_hang_id/bikes'
    , tokenUtil.checkToken 
    , customerHanlder.getCustomerBikes
);
router.get('/customers/:khach_hang_id/maintances'
    , tokenUtil.checkToken 
    , customerHanlder.getCustomerMaintances
);
router.get('/customers-bikes/:khach_hang_xe_id'
    , tokenUtil.checkToken 
    , customerHanlder.getCustomerBikeInfo
);
router.get('/customers/maintances/:bao_duong_id'
    , tokenUtil.checkToken 
    , customerHanlder.getCustomerMaintanceInfo
);
router.get('/maintances/:bao_duong_id/details'
    , tokenUtil.checkToken 
    , customerHanlder.getMaintanceDetails
);
router.put('/maintances/:bao_duong_id'
    , tokenUtil.checkToken 
    , postHandler.jsonProcess
    , customerHanlder.updateFeedbackAfterMaintance
);
router.post('/maintances/:bao_duong_id/schedules'
    , tokenUtil.checkToken 
    , postHandler.jsonProcess
    , customerHanlder.addSchedule
);
router.put('/customers/bikes/:khach_hang_xe_id'
    , tokenUtil.checkToken 
    , postHandler.jsonProcess
    , customerHanlder.updateFeedbackAfterBuy
);
router.post('/customers-bikes/:khach_hang_xe_id/callouts'
    , tokenUtil.checkToken 
    , postHandler.jsonProcess
    , customerHanlder.addCallout
);
router.post('/customers-bikes/:khach_hang_xe_id/maintances'
    , tokenUtil.checkToken 
    , postHandler.jsonProcess
    , customerHanlder.addMaintance
);

module.exports = router;
