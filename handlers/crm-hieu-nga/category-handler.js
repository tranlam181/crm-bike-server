"use strict"
/**
 * su dung de kiem tra quyen truy cap
 * phan quyen user
 * bien dau vao la req.user
 * xu ly tu token truoc do, neu req.user.data.role===99 la quyen root (chi developer 903500888 thoi)
 *
 */
const db = require('../../db/sqlite3/crm-hieu-nga-dao')

class Handler {
    getProvinces(req, res, next) {
        db.getRsts(`SELECT province_code, name
            FROM dm_dia_ly
            WHERE district_code = '' AND precinct_code = ''
            ORDER BY name`
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
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
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBikeTypes(req, res, next) {
        db.getRsts("SELECT id, name\
            FROM dm_loai_xe\
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
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getShops(req, res, next) {
        db.getRsts("SELECT id, name\
            FROM dm_cua_hang\
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
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBuyOpinions(req, res, next) {
        db.getRsts("select id,name from  dm_ket_qua_goi_ra where muc_dich_goi_ra_id=3 order by id"
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCallResults(req, res, next) {
        db.getRsts("select id,name from  dm_ket_qua_goi_ra where status is null order by order_"
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getMaintanceTypes(req, res, next) {
        let filter = req.query.filter
        if (!filter || filter=='undefined') filter = ''

        db.getRsts("select id,name \
                    from  dm_loai_bao_duong \
                    where status is null \
                    AND ((ifnull(?,'') = '' OR name_no_sign LIKE '%' || UPPER(?) || '%' )) \
                    ORDER BY name_no_sign\
                    limit 20", [filter, filter]
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getKieuBaoDuongs(req, res, next) {
        db.getRsts("select id,name \
                    from  dm_loai_bao_duong \
                    ORDER BY id", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getServiceTypes(req, res, next) {
        db.getRsts("select id, name from dm_dich_vu order by name", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row
                , (key, value) => {
                    if (value === null) { return undefined; }
                    return value;
                }
            ));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCalloutPurposes(req, res, next) {
        db.getRsts("select id, name from dm_muc_dich_goi_ra order by order_", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBikeColors(req, res, next) {
        db.getRsts("select id, name from dm_mau_xe", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }
}

module.exports = {
    Handler: new Handler()
};
