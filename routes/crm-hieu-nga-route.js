"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenUtil = require('../utils/token-util');

//test phan quyen kiem tra quyen, lay quyen
const categoryHandler = require("../handlers/crm-hieu-nga/category-handler").Handler;
const customerHanlder = require("../handlers/crm-hieu-nga/customer-handler").Handler;
const reportHanlder = require("../handlers/crm-hieu-nga/report-handler").Handler;
const smsHanlder = require("../handlers/crm-hieu-nga/sms-handler").Handler;
const strategyHanlder = require("../handlers/crm-hieu-nga/strategy-handler").Handler;
const appConfigHanlder = require("../handlers/crm-hieu-nga/app-config-handler").Handler;

router.get('/category/provinces'
    , categoryHandler.getProvinces
);
router.get('/category/sms-types'
    , categoryHandler.getSmsTypes
);
router.get('/category/tinhs'
    , categoryHandler.getTinhs
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
    , tokenUtil.checkToken
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
router.get('/category/strategy-types'
    , categoryHandler.getStrategyTypes
);
router.get('/category/callout-purposes'
    , categoryHandler.getCalloutPurposes
);
router.get('/category/staff-attitudes'
    , categoryHandler.getStaffAttitude
);
router.get('/category/jobs'
    , categoryHandler.getJobs
);
router.get('/category/bike-code-types'
    , categoryHandler.getBikeCodeTypes
);
router.post('/import-customer'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.importCustomer
);
router.post('/import-customer-service'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.importCustomerService
);
router.post('/customers'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addCustomer
);
router.put('/customers/:khach_hang_id'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.saveCustomer
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
router.get('/callouts' // ?xe_id=
    , tokenUtil.checkToken
    , customerHanlder.getCallouts
);
router.get('/callins' // ?xe_id=
    , tokenUtil.checkToken
    , customerHanlder.getCallins
);
router.post('/callouts'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addCallout
);
router.post('/callins'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.addCallin
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
router.get('/report/report-callouts' // type&date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.reportCallout
);
router.get('/report/report-callins' // type&date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.reportCallin
);
router.get('/report/report-sms' // type&date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.reportSms
);
router.get('/report/report-services' // type&date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.reportService
);
router.get('/report/report-after-buys'
    , tokenUtil.checkToken
    , reportHanlder.reportAfterBuy
);
router.get('/report/report-after-maintances'
    , tokenUtil.checkToken
    , reportHanlder.reportAfterMaintance
);
router.get('/report/export-customers' // ?type
    , tokenUtil.checkToken
    , reportHanlder.exportCustomer
);
router.get('/report/report-general' // ?date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.reportGeneral
);
router.get('/report/sync-report-daily' // ?date_sta&date_end
    , tokenUtil.checkToken
    , reportHanlder.syncReportDaily
);
router.get('/bikes/:xe_id'
    , tokenUtil.checkToken
    , customerHanlder.getBike
);
router.put('/bikes/:xe_id'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , customerHanlder.saveBike
);
router.get('/sms-configs'
    , smsHanlder.getSmsConfig
);
router.put('/sms-configs'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , smsHanlder.saveSmsConfig
);
router.get('/app-configs'
    , appConfigHanlder.getAppConfig
);
router.put('/app-configs'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , appConfigHanlder.saveAppConfig
);
router.post('/sms/send-sms'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , smsHanlder.sendSmsRequest
);
router.post('/sms/send-sms-list'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , smsHanlder.sendSmsList
);
router.get('/init-next-ktdk_date'
    , tokenUtil.checkToken
    , customerHanlder.initNextKtdkDate
);
router.get('/test'
    , customerHanlder.test
);
router.get('/sms/sms-list'
    , tokenUtil.checkToken
    , smsHanlder.getSmsList
);
router.get('/sms/sms-histories' // ?xe_id=
    , tokenUtil.checkToken
    , smsHanlder.getSmsHistories
);
router.post('/strategy/strategies'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , strategyHanlder.addStrategy
);
router.post('/strategy/callouts'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , strategyHanlder.addCallout
);
router.post('/strategy/import-strategy-bike'
    , tokenUtil.checkToken
    , postHandler.jsonProcess
    , strategyHanlder.importStrategyBike
);
router.get('/strategy/strategies'
    , tokenUtil.checkToken
    , strategyHanlder.getStrategies
);
router.delete('/strategy/strategies/:chien_dich_id'
    , tokenUtil.checkToken
    , strategyHanlder.delStrategy
);
router.get('/strategy/strategy/:chien_dich_id/callout-customers'
    , tokenUtil.checkToken
    , strategyHanlder.getCalloutCustomers
);
router.get('/strategy/report-callouts' // chien_dich_id,type,date_sta,date_end
    , tokenUtil.checkToken
    , strategyHanlder.reportCallout
);
router.get('/strategy/report-sms' // chien_dich_id,type,date_sta,date_end
    , tokenUtil.checkToken
    , strategyHanlder.reportSms
);
router.get('/strategy/sync-report-daily' // chien_dich_id,date_sta,date_end
    , tokenUtil.checkToken
    , strategyHanlder.syncReportDaily
);
router.get('/strategy/report-general' // chien_dich_id,date_sta&date_end
    , tokenUtil.checkToken
    , strategyHanlder.reportGeneral
);
module.exports = router;
