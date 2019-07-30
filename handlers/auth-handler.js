"use strict"
const SQLiteDAO = require('../db/sqlite3/sqlite-dao');
const dbFile = './db/database/crm-bike.db';
const db = new SQLiteDAO(dbFile);
const {capitalizeFirstLetter, removeVietnameseFromString} = require('../utils/utils')

class Handler {
    login(req, res, next) {
        let user = req.json_data
        res.end(JSON.stringify({status: "OK"}))
    }
}

module.exports = {
    Handler: new Handler()
}