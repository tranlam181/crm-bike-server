"use strict"

const router = require('express').Router();

const postHandler = require('../utils/post-handler');
const tokenHandler = require('../utils/token-proxy');
const pdfHandler = require('../handlers/pdf-handler');

const resourceHandler = require('../handlers/resource-handler');

let handlers = resourceHandler.ResourceHandler;


//test phan quyen kiem tra quyen, lay quyen
const adminHandller = require("../handlers/admin-handler").Handler;
router.get('/get-roles'
, tokenHandler.getTokenNext
, tokenHandler.verifyProxyTokenNext
, adminHandller.getRoles
);

router.get('/get-menu'
, tokenHandler.getTokenNext
, tokenHandler.verifyProxyTokenNext
, adminHandller.getUserMenu
);
///


//lay cau hinh ve de thay doi cau hinh in an
router.get('/json-print-mask'
                , handlers.getPrintMask);
//tra ket qua in tu client config
router.post('/json-print-mask'
                , postHandler.jsonProcess
                , handlers.postPrintMask);

//lay cac mau toa do ve in ra len backgroud --> ghi toa do va in
router.get('/matrix-a4', pdfHandler.getMatrixA4);
router.get('/matrix-a5', pdfHandler.getMatrixA5);


//kiem tra token dung cho phep lay tai nguyen nay
/**
 * lay tham so
 */
router.get('/json-parameters'
    , tokenHandler.getToken
    , tokenHandler.verifyProxyToken
    , handlers.getParameters
); //ok

/**
 * lay ds kh
 */
router.get('/json-customers'
    , tokenHandler.getToken
    , tokenHandler.verifyProxyToken
    , handlers.getCustomers
);   //ok

/**
 * lay cac ky hoa don da tao truoc do
 */
router.get('/json-bill-cycles'
    , tokenHandler.getToken
    , tokenHandler.verifyProxyToken
    , handlers.getBillCycles
);   //ok

//khong can xac thuc lay duoc gia
router.get('/json-prices'
    , handlers.getPrices
);   


/**
 * Tao ky hoa don de in an hoa don
 * tao ky hoa don {bill_cycle, bill_date, invoice_no, cust_id}
 */
router.post('/create-invoices'
, tokenHandler.getToken
, tokenHandler.verifyProxyToken
, postHandler.jsonProcess //lay json_data
, handlers.createInvoices);


//tra ket qua in hoa don in don le, in nhom, in het, co/khong backgroud kieu json
router.get('/json-invoices/*'
    , tokenHandler.getToken
    , tokenHandler.verifyProxyToken
    , handlers.getInvoices
);   //OK

//tra ket qua in hoa don in don le, in nhom, in het, co/khong background kieu pdf
/**
 * Tao ban in pdf hoa don
 */
router.get('/pdf-invoices/*'
    , tokenHandler.getToken
    , tokenHandler.verifyProxyToken
    , handlers.getPdfInvoices); //OK


router.post('/edit-customer' //chi co user co quyen sua thi moi thuc hien
    , postHandler.jsonProcess //lay json_data
    , tokenHandler.getToken   //req.token
    , tokenHandler.verifyProxyToken //req.user
    , adminHandller.setFunctionFromPath //thiet lap chuc nang tu pathName
    , adminHandller.checkFunctionRole   //kiem tra quyen co khong de cho phep
    , handlers.editCustomer    //ghi xuong csdl
);   //ok

module.exports = router;