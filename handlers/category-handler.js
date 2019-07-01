"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 * 
 */
const SQLiteDAO = require('../db/sqlite3/sqlite-dao');
const dbFile = './db/database/crm-bike.db';
const db = new SQLiteDAO(dbFile);

class Handler {
    getProvinces(req, res, next) {
        db.getRsts("SELECT province_code, name \
            FROM dm_dia_ly \
            WHERE district_code = '' AND precinct_code = '' \
            ORDER BY name"
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            console.log('error:',err);
            //res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end("");
        });
    }

    getDistricts(req, res, next) {
        let province_code = req.params.province_code

        db.getRsts("SELECT district_code, name\
            FROM dm_dia_ly\
            WHERE precinct_code = '' AND district_code <> '' AND province_code = '"+ province_code +"'\
            ORDER BY name"
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            console.log('error:',err);
            //res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end("");
        });
    }

    getPrecincts(req, res, next) {
        let province_code = req.params.province_code
        let district_code = req.params.district_code

        db.getRsts("SELECT precinct_code, name\
            FROM dm_dia_ly\
            WHERE precinct_code <> '' AND district_code = '"+ district_code +"' AND province_code = '"+ province_code +"'\
            ORDER BY name"
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            console.log('error:',err);
            //res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end("");
        });
    }
}

module.exports = {
    Handler: new Handler()
};