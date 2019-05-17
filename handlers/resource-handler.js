"use strict"

const timeZoneOffset = +7;
const vnUtils = require('../utils/vietnamese-handler');
const arrObj = require('../utils/array-object');



const SQLiteDAO = require('../db/sqlite3/sqlite-dao');
const dbFile = './db/database/invoice-vinhhung.db';
const db = new SQLiteDAO(dbFile);

const PDFDocument = require('pdfkit');
const fs = require('fs');

//ma tran in hoa don
const offset_1 = 0 - 5; //hoa don lien 2 giao cho khach
const offset_2 = 422 + 17; //hoa don lien 2 giao cho khach

const image_size = {left:-5, top:-18, width: 610, height: 890 };

//neu khong can in truong nao thi rao lai khong khai bao
var billPrintMatrix = {
    bill_date: [{ col: 285, row: 58 }, { col: 340, row: 58 }, { col: 387, row: 58 }],
    //invoice_no: { col: 480, row: 55, color: 'black'},
    full_name: { col: 160, row: 90 },
    organization_name: { col: 120, row: 105 },
    tax_no: { col: 120, row: 120 },
    address: { col: 120, row: 135 },
    pay_method: { col: 145, row: 148 },
    account_no: { col: 310, row: 148 },
    bill_details: [
        {
            unit: { col: 280, row: 185 },
            product_count: { col: 260, row: 185, width: 100, align: 'right', color: 'black' },
            price_not_vat: { col: 350, row: 185, width: 100, align: 'right', color: 'black' },
            total_not_vat: { col: 450, row: 185, width: 100, align: 'right', color: 'black' }
        }
    ],
    bill_sum: {
        sum_not_vat: { col: 450, row: 219, width: 100, align: 'right', color: 'black' },
        sum_vat: { col: 450, row: 238, width: 100, align: 'right', color: 'black' },
        sum_charge: { col: 450, row: 257, width: 100, align: 'right', color: 'black' }
    },
    bill_sum_charge_spell: { col: 155, row: 278, color: 'black' },
    /* sign_customer: {
        signature: { col: 120, row: 330 },
        full_name: { col: 105, row: 380 }
    }, */
    sign_saler: {
        signature: { col: 290, row: 330 },
        full_name: { col: 280, row: 380 }
    },
    sign_manager: {
        signature: { col: 470, row: 330 },
        full_name: { col: 450, row: 380 }
    }
};


var selectCustomers = (req) => {
    let sql = 'select \
                    a.id\
                    ,a.full_name\
                    ,a.organization_name\
                    ,a.tax_no\
                    ,a.address\
                    ,a.email\
                    ,a.phone\
                    ,a.cust_id\
                    ,a.last_name \
                    ,a.first_name \
                    ,a.type_id\
                    ,b.name as cust_type\
                    ,a.price_id\
                    ,b.unit\
                    ,b.not_vat\
                    ,b.vat\
                    ,b.charge\
                    ,a.area_id\
                    ,c.description as area\
                    ,a.staff_id\
                    ,d.description as staff\
                    ,a.start_date\
                    ,a.end_date\
                    ,a.change_time\
                    ,a.status\
                    from customers a\
                    ,prices b\
                    ,(select code, description from parameters where type = 6) c\
                    ,(select code, description from parameters where type = 4) d\
                    where 1=1 \
                    '+(req.paramS&&req.paramS.id?('and a.id = \'' + req.paramS.id + '\' '):'')+' \
                    '+(req.paramS&&req.paramS.cust_id?('and a.cust_id = \'' + req.paramS.cust_id + '\' '):'')+' \
                    '+(req.paramS&&req.paramS.area_id?('and a.area_id = \'' + req.paramS.area_id + '\' '):'')+' \
                    '+(req.paramS&&req.paramS.staff_id?('and a.staff_id = \'' + req.paramS.staff_id + '\' '):'')+' \
                    '+(req.paramS&&req.paramS.price_id?('and a.price_id = \'' + req.paramS.price_id + '\' '):'')+' \
                    and a.price_id = b.id\
                    and a.area_id = c.code\
                    and a.staff_id = d.code\
                    order by area_id,first_name, last_name, cust_id\
                    '+(req.paramS&&req.paramS.limit?('LIMIT '+req.paramS.limit):'')+'\
                    '+(req.paramS&&req.paramS.offset?('OFFSET '+req.paramS.offset):'')+'\
                    ';

    return db.getRsts(sql)
        .then(results => {
            return results;
        });
}

var selectInvoicesJson = (req) => { 
    
    return (new Promise( async (resolve, reject) => {
        var saler = await db.getRst("select description as full_name, signature from parameters where id = '"+33+"'");
        var manager = await db.getRst("select description as full_name, signature from parameters where id = '"+32+"'");
        var bill_details = await db.getRsts(
                                "select              \
                                c.cust_id             \
                                ,d.unit         \
                                ,c.product_count \
                                ,c.price_not_vat \
                                ,c.total_not_vat \
                                from bills c, prices d\
                                where c.bill_cycle= '" + req.bill_cycle + "'\
                                "+(req.paramS&&req.paramS.cust_id?("and c.cust_id = '" + req.paramS.cust_id + "' "):"")+" \
                                and c.price_id = d.id \
                                ");

        db.getRsts(
            "select           \
            a.cust_id            \
            ,b.bill_date          \
            ,b.bill_cycle          \
            ,b.invoice_no         \
            ,a.full_name         \
            ,a.organization_name \
            ,a.tax_no            \
            ,a.address        \
            ,a.pay_method     \
            ,a.account_no     \
            ,b.sum_not_vat    \
            ,b.sum_vat        \
            ,b.sum_charge     \
            ,a.signature      \
            from\
            customers a\
            ,invoices  b\
            where b.bill_cycle = '"+ req.bill_cycle + "' \
            "+(req.paramS&&req.paramS.id?("and a.id = '" + req.paramS.id + "' "):"")+" \
            "+(req.paramS&&req.paramS.cust_id?("and a.cust_id = '" + req.paramS.cust_id + "' "):"")+" \
            "+(req.paramS&&req.paramS.area_id?("and a.area_id = '" + req.paramS.area_id + "' "):"")+" \
            "+(req.paramS&&req.paramS.price_id?("and a.price_id = '" + req.paramS.price_id + "' "):"")+" \
            "+(req.paramS&&req.paramS.staff_id?("and a.staff_id = '" + req.paramS.staff_id + "' "):"")+" \
            and a.cust_id = b.cust_id  \
            and a.cust_id = b.cust_id \
            order by a.area_id, a.first_name, a.last_name, a.cust_id\
            "+(req.paramS&&req.paramS.limit?("LIMIT "+req.paramS.limit):"")+"\
            "+(req.paramS&&req.paramS.offset?("OFFSET "+req.paramS.offset):"")+"\
            ")
            .then(invoices => {
                let invoicesPrint = []
                invoices.forEach(el => {

                    el.bill_details = bill_details.filter(x => x.cust_id == el.cust_id);
                    el.bill_sum_charge_spell = vnUtils.StringVietnamDong(el.sum_charge);
                    el.bill_sum = {
                        sum_not_vat: el.sum_not_vat,
                        sum_vat: el.sum_vat,
                        sum_charge: el.sum_charge
                    };
                    el.sign_customer = {
                        signature: null,
                        full_name: el.full_name
                    }
                    el.sign_saler = {
                        signature: saler.signature,
                        full_name: saler.full_name
                    }
                    el.sign_manager = {
                        signature: manager.signature,
                        full_name: manager.full_name
                    }
                    invoicesPrint.push(el);
                })

                resolve(invoicesPrint);

            })
            .catch(err => {
                reject(err);
            });
    }));
}

var selectInvoicesMatrix = (req) => {
    return selectInvoicesJson(req)
        .then(invoices => {
            var old = JSON.stringify(invoices
                , (key, value) => {
                    if (key == 'start_date') return new Date(value + timeZoneOffset * 60 * 60 * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    if (typeof value == 'number') return '' + value; //chuyen doi thanh chuoi (format dau . hoac dau trong)
                    if (key == 'bill_date'&&value) return [value.slice(6, 8), value.slice(4, 6), value.slice(2, 4)]
                    return value;
                }
            ); //convert to JSON string
            const invoicesPrintString = JSON.parse(old); //convert back to array
            let printMatrixs = [];
            invoicesPrintString.forEach(el => {
                printMatrixs.push(arrObj.getMatrix(billPrintMatrix, el, { col: 0, row: 0 })); //cac cot gia tri nhieu nhat cau hinh in
            });
            return printMatrixs;
        })
        .catch(err => {
            console.log(err);
            return err;
        })
}


var json2SqliteSQLUpdateCustomerId = (tablename, json, idFields) => {
    let jsonInsert = { name: tablename, cols: [], wheres: [] }
    let whereFields = idFields ? idFields : ['cust_id'];
    for (let key in json) {
        jsonInsert.cols.push({ name: key, value: json[key] });
        if (whereFields.find(x => x === key)) jsonInsert.wheres.push({ name: key, value: json[key] })
    }
    return jsonInsert;
}

var createInvoicesCycle = (bill_cycle_in,bill_date_in,invoice_no_in, cust_id)=>{
   
    let bill_cycle = bill_cycle_in?bill_cycle_in.slice(0,6): new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(0,6);
    let bill_date = bill_date_in?bill_date_in.slice(0,8): new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').slice(0,8);
    let invoice_no = invoice_no_in?invoice_no_in:1; //so hoa don bat dau tu 1 (so hoa don truoc do)

    var customerPromise = new Promise((resolveCustomers,rejectCustomers)=>{
        db.getRsts("select cust_id, price_id, area_id, staff_id\
                                  from customers a\
                                  where status=1 \
                                  " + (cust_id ? "and a.cust_id = '" + cust_id + "'": "") + "\
                                  order by id")
            .then(results => {
                resolveCustomers(results);
            })
            .catch(err => {
                rejectCustomers(err);
            })
    })

    var pricesPromise =  new Promise((resolvePrices,rejectPrices)=>{
        db.getRsts('select id ,product_id, unit, not_vat ,vat, charge from prices where status = 1')
            .then(results => {
                resolvePrices(results);
            })
            .catch(err => {
                rejectPrices(err);
            })
    })

    //tra ve no mot Promise
    return pricesPromise
    .then(prices=>{
        return customerPromise.then(customers=>{

            console.log('doc xong du lieu tao', customers.length, prices.length);

            var count = 0;

            var customerInvoicePromise = new Promise((resolve,reject)=>{
                //duyet Mang khach hang muon tao hoa don
                customers.forEach((el,idx)=>{

                    let product_count = 1; //so luong
                    let price = prices.find(x => x.id === el.price_id);
    
                    let bill_detail = {
                        cust_id         : el.cust_id,          //khach mua
                        bill_cycle      : bill_cycle,    //ky mua
                        product_count   : product_count, //so luong
                        price_id        : el.price_id,        //gia
                        price_not_vat   : price.not_vat,
                        total_not_vat   : price.not_vat * product_count,
                        total_vat       : price.vat * product_count
                    };
    
                    let sqlBill = json2SqliteSQLUpdateCustomerId('bills', bill_detail, ['cust_id','bill_cycle', 'price_id']) ;
    
                    var billDetailPromise = new Promise((resolveBill,rejectBill)=>{
                        db.insert(sqlBill)
                            .then(data => {
                                resolveBill(data);
                            })
                            .catch(err => {
                                db.update(sqlBill)
                                .then(data=>{
                                    resolveBill(data);
                                })
                                .catch(err=>{
                                    rejectBill(err);
                                })
                            })
                    })
                    
    
                        let bill_sum={};
                        bill_sum.sum_not_vat    = price.not_vat * product_count;
                        bill_sum.sum_vat        = price.vat * product_count;
                        bill_sum.sum_charge     = price.charge * product_count
    
                        let invoice = {
                            cust_id         : el.cust_id
                            , bill_cycle    : bill_cycle
                            , bill_date     : bill_date
                            , invoice_no    : invoice_no++
                            , sum_not_vat   : bill_sum.sum_not_vat
                            , sum_vat       : bill_sum.sum_vat
                            , sum_charge    : bill_sum.sum_charge
                        };
    
                        let sqlInvoice = json2SqliteSQLUpdateCustomerId('invoices', invoice,  ['cust_id','bill_cycle']);

                        //console.log('sqlInvoice', sqlInvoice);

                        var invoicePromise = new Promise((resolveInvoice,rejectInvoice)=>{
                            db.insert(sqlInvoice)
                                .then(data => {
                                    resolveInvoice(invoice_no);
                                })
                                .catch(err => {
                                    db.update(sqlInvoice)
                                    .then(data=>{
                                        resolveInvoice(invoice_no);
                                    })
                                    .catch(err=>{
                                        rejectInvoice(err);            
                                    })
                                })
                        })
                        
                        billDetailPromise
                            .then(billResult=>{
                                invoicePromise.then(invoiceResult=>{
                                    count++; //xong 1 bang ghi
                                    if (count>=customers.length){
                                        console.log('Tao xong hoa don ky', count , bill_cycle, bill_date);
                                        resolve(
                                            {
                                                status: true
                                                , message:'Tao xong hoa don ky'
                                                , count: count 
                                                , bill_cycle: bill_cycle
                                                , bill_date: bill_date
                                                , invoice_no: invoice_no
                                            }
                                        );
                                    }
                                })
                                .catch(err=>{reject(
                                    {message:'Level 1:',error:err}
                                )})
                            })
                            .catch(err=>{reject(
                                {message:'Level 2:',error:err}
                            )})
            })
            });

            return customerInvoicePromise; //tra ve promise

        })
        .catch(err=>{throw {message:'Level 3:',error:err}});
    })
    .catch(err=>{throw {message:'ALL:',error:err}});
};

var createPdfInvoices = (invoices, outputFilename, background) => {

    //bat dau tao pdf
    var doc = new PDFDocument({
        size: 'A4',
        margin: 0
    });
    var defaultColor = 'blue';
    var stream = doc.pipe(fs.createWriteStream(outputFilename));

    doc.info['Title'] = 'Mẫu in hóa đơn A4 1 trang';
    doc.info['Author'] = 'Đoàn Quốc Cường';

    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.font('Time-new-roman-utf8');

    //trang luu
    invoices.forEach((invoice, idx) => {
        if (idx > 0) doc.addPage(); //in hoa don moi
        if (background) doc.image(background, image_size.left, image_size.top, { width: image_size.width, height: image_size.height });
        doc.fontSize(12);
        doc.fillColor(defaultColor);
        invoice.forEach(el => {
            if (el.color) doc.fillColor(el.color);
            if (el.value && el.value.length) {
                doc.text(el.value, el.col, el.row + offset_1, { width: el.width, align: el.align });
                doc.text(el.value, el.col, el.row + offset_2, { width: el.width, align: el.align });
            }
            doc.fillColor(defaultColor);
        });
    })
    doc.end();

    return stream;
}

class ResourceHandler {

    /**
     * cap nhat du lieu khach hang vao csdl
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    editCustomer(req, res, next) {
        //thuc hien luu tru vao csdl

        //ktra chu ky hop le ko?
        let dataJson = req.json_data;

        if (dataJson.full_name){
            let splitName = vnUtils.splitFullName(dataJson.full_name);
            if (splitName){
                dataJson.first_name = splitName.first_name;
                dataJson.last_name = splitName.last_name;
                dataJson.full_name = splitName.last_name + " " + splitName.first_name;
            }
        }
        dataJson.change_time = Date.now();
        dataJson.signature = JSON.stringify({username: req.user.username, data: req.json_data, time: dataJson.change_time}) ;
        let jsonUpdate = arrObj.convertSqlFromJson("customers", dataJson, ["id"]);
        //console.log(req.user.username, dataJson, jsonUpdate);
        db.update(jsonUpdate)
        .then(data=>{
            req.paramS = {id: dataJson.id};
            selectCustomers(req)
            .then(results=>{
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results[0]
                        , (key, value) => {
                            if (value === null) { return undefined; }
                            return value;
                        }
                ));
            })
            .catch(err=>{
                console.log('Loi select',err);
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({message:"Lỗi select CSDL", error: err}));
            })
            //tra lai du lieu khach hang da chinh sua
        })
        .catch(err=>{
            console.log('Loi update',err);
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({message:"Lỗi cập nhật CSDL", error: err}));
        })
    }


    /**
     * tạo hóa đơn theo req.json_data = {bill_cycle,bill_date,invoice_no,cust_id}
     * ket qủa cho biêt tạo được bao nhiêu hoá đơn, chu kỳ, ngày hóa đơn và số hóa đơn cho phiên sau
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    createInvoices(req, res, next) {
        if (req.json_data 
            && req.json_data.bill_cycle 
            && req.json_data.bill_date
            && req.json_data.invoice_no
            ) {

            createInvoicesCycle(
                req.json_data.bill_cycle
                , req.json_data.bill_date
                , req.json_data.invoice_no
                , req.json_data.cust_id
                )
            .then(data=>{
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({status: true, message: "Created invoice successfull!", data: data }));
            })
            .catch(err=>{
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: "Can not create Invoice cycle!", error: err }));
            });


        } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify({ message: "No json_data post" }));
        }
    }

    /**
     * Lay cac ky cuoc da duoc khoa so
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getBillCycles(req, res, next) {
        db.getRsts("select bill_cycle\
            ,count(cust_id) as count_customer\
            ,min(bill_date) as bill_date_min\
            ,max(bill_date) as bill_date\
            ,min(invoice_no) as invoice_no_min\
            ,max(invoice_no) as invoice_no\
            from invoices a\
             where 1=1 \
            "+(req.paramS&&req.paramS.bill_cycle?("and a.bill_cycle = '" + req.paramS.bill_cycle + "' "):"")+" \
            group by bill_cycle\
            order by bill_cycle desc\
            "+(req.paramS&&req.paramS.limit?('LIMIT '+req.paramS.limit):'')+"\
            "+(req.paramS&&req.paramS.offset?('OFFSET '+req.paramS.offset):'')+"\
            ")
        .then(billCycles=>{
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(billCycles
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            });
    }

    /**
     * Lay tham so he thong ve mang tham so
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getParameters(req, res, next) {
        db.getRsts('select * \
                              from parameters a\
                              where 1=1 \
                                '+(req.paramS&&req.paramS.id?('and a.id = \'' + req.paramS.id + '\' '):'')+' \
                                '+(req.paramS&&req.paramS.type?('and a.type = \'' + req.paramS.type + '\' '):'')+' \
                                '+(req.paramS&&req.paramS.parent?('and a.parent = \'' + req.paramS.parent + '\' '):'')+' \
                                order by type, parent, order_1, code\
                                '+(req.paramS&&req.paramS.limit?('LIMIT '+req.paramS.limit):'')+'\
                                '+(req.paramS&&req.paramS.offset?('OFFSET '+req.paramS.offset):'')+'\
                                ')
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            });
    }


    getPrices(req, res, next) {
        db.getRsts('select id as code, name as description, product_id, unit, not_vat ,vat, charge from prices where status = 1')
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(results
                    , (key, value) => {
                        if (value === null) { return undefined; }
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            });
    }

    /**
     * Lay json khach hang
     * mat nhien la lay 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getCustomers(req, res, next) {

        selectCustomers(req)
            .then(customers => {
                //console.log('customers',customers)
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(customers
                    , (key, value) => {
                        if (value === null) {
                            //chuyen doi null khong xuat hien
                            return undefined;
                        }
                        if (key === 'start_date') {
                            //chuyen doi thoi gian milisecond thanh string ngay gio
                            return new Date(value + timeZoneOffset * 60 * 60 * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        }
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            });
    }

    /**
     * Lay hoa don excel theo ky,khach le?backgroud=yes/no
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getInvoices(req, res, next) {
         
        req.bill_cycle = req.pathName.substring('/qld/db/json-invoices/'.length).slice(0, 6);

        selectInvoicesJson(req)
            .then(invoices => {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(invoices
                    , (key, value) => {
                        if (value === null) return undefined
                        if (key == 'start_date') return new Date(value + timeZoneOffset * 60 * 60 * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                        return value;
                    }
                ));
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify(err));
            });

    }

   

    getPdfInvoices(req, res, next) {

        req.bill_cycle = req.pathName.substring('/qld/db/pdf-invoices/'.length).slice(0, 6);
        let bg = req.paramS.background;

        selectInvoicesMatrix(req)
            .then(invoicesMatrix => {
                
                //console.log(invoicesMatrix);

                let outputFilename = './pdf/invoice_'+req.bill_cycle+'.pdf';
                let background = './pdf/mau_hoa_don.png';

                let stream = createPdfInvoices(invoicesMatrix, outputFilename, bg ? background : undefined);

                stream.on('finish', () => {
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                        res.end(bufferPdf);
                    });
                });
            })
            .catch(err => {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({message:'Lỗi đọc file pdf', error:err}));
            });

    }

    /**
     * tra ds khack hang bang excel
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getExcelCustomers(req, res, next) {

    }

    /**
     * tra ds hoa don bang excel 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getExcelInvoices(req, res, next) {

    }


    //lay cau hinh ve de thay doi cau hinh in an
    getPrintMask(req, res, next) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(billPrintMatrix
            , (key, value) => {
                if (value === null) { return undefined; }
                return value;
            }
        ));
    }
    //tra ket qua in tu client config
    postPrintMask(req, res, next) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(req.json_data));
    }
    

}

module.exports = {
    ResourceHandler: new ResourceHandler()

};