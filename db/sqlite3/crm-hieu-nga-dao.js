"use strict"

const SQLiteDAO = require('./sqlite-dao');
const dbFile = './db/database/crm-hieu-nga.db';

module.exports = new SQLiteDAO(dbFile);