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

    getTinhs(req, res, next) {
        db.getRsts(`SELECT max(id) AS id, province AS name
            FROM dm_quan_huyen
            GROUP BY province
            ORDER BY province`
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
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
        let muc_dich_goi_ra_id = Number(req.query.muc_dich_goi_ra_id)

        db.getRsts(`select id,name
                    from  dm_ket_qua_goi_ra
                    where (? = 1 AND is_ktdk = 1)
                        OR (? = 2 AND is_bd = 1)
                        OR (? = 3 AND is_mua_xe = 1)
                        OR (? = 4 AND is_ktdk_sms = 1)
                        OR (? = 5 AND is_telesale = 1)
                    order by order_`,
                    [
                        muc_dich_goi_ra_id,
                        muc_dich_goi_ra_id,
                        muc_dich_goi_ra_id,
                        muc_dich_goi_ra_id,
                        muc_dich_goi_ra_id
                    ]
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

        db.getRsts(`select id,name \
                    from  dm_loai_bao_duong \
                    ORDER BY id`, []
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

    getEquips(req, res, next) {
        db.getRsts(`select id,name
                    from  dm_dich_vu_chi_tiet
                    WHERE status IS NULL
                    ORDER BY name_no_sign`, []
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

    getStaffs(req, res, next) {
        let cua_hang_id = req.params.cua_hang_id
        db.getRsts(`select id,name \
                    from  dm_nhan_vien \
                    ORDER BY id`, []
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
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getStrategyTypes(req, res, next) {
        db.getRsts("select id, name from dm_loai_chien_dich order by order_", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getCalloutPurposes(req, res, next) {
        db.getRsts("select id, name FROM dm_muc_dich_goi_ra WHERE ORDER BY order_", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getStaffAttitude(req, res, next) {
        db.getRsts("select id, name from dm_thai_do_nhan_vien", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBikeCodeTypes(req, res, next) {
        db.getRsts("select id, name from dm_ma_loai_xe ORDER BY name", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getJobs(req, res, next) {
        db.getRsts("select id, name from dm_nghe_nghiep ORDER BY name", []
        ).then(row => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(row));
        }).catch(err => {
            res.status(400).end(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
    }

    getBikeColors(req, res, next) {
        db.getRsts("select id, name from dm_mau_xe ORDER BY name", []
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
