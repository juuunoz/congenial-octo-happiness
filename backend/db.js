// db.js
const Database = require('better-sqlite3');
const db = new Database('app.db');

db.pragma('journal_mode = WAL');

db.exec(`
  
`);

module.exports = db;