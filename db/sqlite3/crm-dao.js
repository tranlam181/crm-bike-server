"use strict"

const SQLiteDAO = require('./sqlite-dao');
const dbFile = './db/database/crm-bike.db';

module.exports = new SQLiteDAO(dbFile);