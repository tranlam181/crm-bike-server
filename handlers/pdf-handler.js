"use strict"

const mime = require('mime-types');
const fs = require('fs');
const pdfUtil = require('../utils/pdf-util');

const matrixA4 = './pdf/matrix_A4.pdf';
const matrixA5 = './pdf/matrix_A5.pdf';

const getMatrixA4 = (req, res, next)=>{

    fs.readFile(matrixA4, { flag: 'r' }, (err, bufferPdf)=>{
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify(err));
        }else{
            res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
            res.end(bufferPdf);
        }
    });
}

const getMatrixA5 = (req, res, next)=>{
        fs.readFile(matrixA5, { flag: 'r' }, (err, bufferPdf)=>{
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            }else{
                res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                res.end(bufferPdf);
            }
        });
}

const createPdfInvoices = (req, res, next)=>{
    //ham nay la ham sequence (chay dong bo nen phai doi chay xong)
    //phien truoc xu ly gan con tro: req.pdf_config,req.pdf_file
    let fileOut = req.pdf_file;
    let jsonPdfConfig = req.pdf_config;

    let stream = pdfUtil.createPdf(jsonPdfConfig,fileOut);

    stream.on('finish', () =>{
        fs.readFile(fileOut, { flag: 'r' }, (err, bufferPdf)=>{
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            }else{
                res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                res.end(bufferPdf);
            }
        });
    });
}

const getAnyFile = (req, res, next)=>{

    let fileRead = req.file_any;

    fs.readFile(fileRead, { flag: 'r' }, (err, buffer)=>{
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify(err));
        }else{
            //chuyen doi contenType de lay con
            let contentType = 'application/pdf';
            if (mime.lookup(fileRead)) contentType = mime.lookup(fileRead);
            res.writeHead(200, { 'Content-Type': contentType +'; charset=utf-8' });
            res.end(buffer);
        }
    });
}

module.exports = {
    getAnyFile: getAnyFile,
    getMatrixA5: getMatrixA5,
    getMatrixA4: getMatrixA4,
    createPdfInvoices: createPdfInvoices
};