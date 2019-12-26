"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenUtil = require('../utils/token-util');

//test phan quyen kiem tra quyen, lay quyen
const categoryHandler = require("../handlers/crm-hieu-nga/category-handler").Handler;
const customerHanlder = require("../handlers/crm-hieu-nga/customer-handler").Handler;
const smsHanlder = require("../handlers/crm-hieu-nga/sms-handler").Handler;

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
router.get('/category/bike-colors'
    , categoryHandler.getBikeColors
);
router.get('/category/shops'
    , categoryHandler.getShops
);
router.get('/category/equips'
    , categoryHandler.getEquips
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
router.get('/category/shops/:cua_hang_id/staffs'
    , categoryHandler.getStaffs
);
router.get('/category/kieu-bao-duongs'
    , categoryHandler.getKieuBaoDuongs
);
router.get('/category/service-types'
    , categoryHandler.getServiceTypes
);
router.get('/category/callout-purposes'
    , categoryHandler.getCalloutPurposes
);
router.get('/category/staff-attitudes'
    , categoryHandler.getStaffAttitude
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
router.put('/callouts/after-service'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.updateFeedbackAfterMaintance
);
router.post('/maintances/:bao_duong_id/schedules'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addSchedule
);
router.put('/callouts/after-buy'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.updateFeedbackAfterBuy
);
router.get('/callouts'
    , tokenUtil.checkToken
    , customerHanlder.getCallouts
);
router.post('/callouts'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addCallout
);
router.post('/services'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addService
);
router.get('/services'
    , tokenUtil.checkToken
    , customerHanlder.getServices
);
router.get('/services/:dich_vu_id'
    , tokenUtil.checkToken
    , customerHanlder.getService
);
router.get('/report-callouts'
    , tokenUtil.checkToken
    , customerHanlder.reportCallout
);
router.get('/report-maintances'
    , tokenUtil.checkToken
    , customerHanlder.reportMaintance
);
router.get('/report-after-buys'
    , tokenUtil.checkToken
    , customerHanlder.reportAfterBuy
);
router.get('/report-after-maintances'
    , tokenUtil.checkToken
    , customerHanlder.reportAfterMaintance
);
router.get('/export-customers'
    , tokenUtil.checkToken
    , customerHanlder.exportCustomer
);
router.get('/bikes/:xe_id'
    , tokenUtil.checkToken
    , customerHanlder.getBike
);
router.get('/sms-configs'
    , smsHanlder.getSmsConfig
);
router.put('/sms-configs'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , smsHanlder.saveSmsConfig
);
router.post('/send-sms'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , smsHanlder.sendSmsRequest
);
router.get('/test-send-sms-job'
    , smsHanlder.sendSmsJob
);
module.exports = router;
