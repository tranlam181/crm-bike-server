
/**
 * file nay la cac thu tuc tao bang va du lieu mau tu excel vao db
 * 
 */

// dich vu tao csdl hoa don ban dau
// doc excel, tao db, tao table
const fs = require('fs');
const SQLiteDAO = require('./sqlite-dao');
const xlsxtojson1st = require("xlsx-to-json-lc");
const excelToJsonAll = require('convert-excel-to-json');

var db;

class HandlerExcel2SqLite {

    /**
     * su dung de tao lai database ban dau
     * @param {*} excelFileInput 
     * @param {*} databaseFile 
     */
    createDatabase(excelFileInput, databaseFile){

        if (fs.existsSync(excelFileInput)) {
            db = new SQLiteDAO(databaseFile);

            setTimeout(() => {
                if (fs.existsSync(databaseFile)){
                    this.initTable(excelFileInput);
                    console.log('Database '+ databaseFile + ' ready!');
                }else{
                    throw 'No Database Sqlite' + databaseFile
                }
            }, 1000);

        }else{
            throw 'No Database Setting xlsx ' + excelFileInput
        }
    }

    
    //khoi tao cac bang luu so lieu
    initTable(excelFileInput){
        
        //doc excel
        try {
            xlsxtojson1st({
                input: excelFileInput,
                output: null, //since we don't need output.json
                lowerCaseHeaders:true
            }, ( err, results)=>{
                if(err) {
                    console.log(err);
                } else{
                    //console.log('result :',results);
                    let distinct_table_name =[];
                    results.forEach(el => {
                        if (!distinct_table_name.find(x=>x==el.table_name)) distinct_table_name.push(el.table_name)
                    });
                    
                    distinct_table_name.forEach( async el=>{
                        let table = results.filter(x=>x.table_name==el);
                        //console.log(table);
                        if (table){
                            let tableJson={};
                            tableJson.name = el;
                            tableJson.cols = [];
                            table.forEach(e=>{
                                let col = {};
                                col.name = e.field_name;
                                col.type = e.data_type;
                                col.option_key = e.options;
                                col.description = e.description;
                                tableJson.cols.push(col);
                            })
                            //console.log(tableJson);
                            try{
                                await db.createTable(tableJson)
                            }catch(err){
                                console.log(err)
                            }
                        }
                    })

                    console.log('table created: ',distinct_table_name);
    
                    setTimeout(()=>{
                        this.initData(distinct_table_name, excelFileInput)
                        .then(data=>{
                            console.log(data);
                        })
                        .catch(err=>{
                            console.log(err);
                        });
                    },1000)

                }
                

            });
        } catch (e){
            console.log("Corupted excel file" + e);
        }
        
    } 
    
    initData(tables,excelFileInput){
        return new Promise((resolve,reject)=>{
            try{
                let results = excelToJsonAll({
                    sourceFile: excelFileInput
                });
    
                tables.forEach(async tablename=>{
                    let sheet = results[tablename];
                    if (sheet!=undefined){
                        console.log('sheet-tablename insert db: ',tablename);
                        //chuyen doi kieu doc dong 1 la header
                        let header=sheet[0];
                        let jsonOut = [];
                        for (let i=1;i<sheet.length;i++){
                            let row = {};
                            for (let col in header){
                                if (sheet[i][col]!=undefined){
                                    Object.defineProperty(row, header[col], { //ten thuoc tinh
                                        value: (tablename=='customers'&&header[col]=='start_date')?new Date().getTime():sheet[i][col], //gia tri cua thuoc tinh
                                        writable: false, //khong cho phep sua du lieu sau khi gan gia tri vao
                                        enumerable: true, //cho phep gan thanh thuoc tinh truy van sau khi hoan thanh
                                        //configurable: false default
                                    });
                                }
                            }
                            jsonOut.push(row);
                        }
                        //thuc hien insert data vao table da tao
                        for (let i=0;i<jsonOut.length;i++){
                            let row = jsonOut[i];
                            let jsonInsert={ name:tablename,cols:[]}
                            for (let key in row){
                                let col = {name:key,value:row[key]};
                                jsonInsert.cols.push(col);
                            }
                            try{
                                await db.insert(jsonInsert)
                            }catch(err){
                                console.log(err);
                            } 
                        }  
                    }
                })

                resolve('Insert DB finish!')

            }catch(e){
                reject("Corupted excel file" + e);
            }
        })
    }
}

module.exports = {
    Excel2Sqlite: new HandlerExcel2SqLite()
};