import Database from 'better-sqlite3';
const db = new Database('app.db');

db.pragma('journal_mode = WAL');

// Store uploaded historical stock data
db.exec(`
    CREATE TABLE IF NOT EXISTS prices (
        ticker TEXT NOT NULL,
        date   TEXT NOT NULL,
        close  REAL NOT NULL,
        PRIMARY KEY (ticker, date)
    ) WITHOUT ROWID;
`)

// Store uploaded etf, one entry per unique upload
db.exec(`
    CREATE TABLE IF NOT EXISTS funds (
        id          INTEGER PRIMARY KEY,
        name        TEXT UNIQUE NOT NULL,
        uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`)

// Store uploaded etf weights
db.exec(`
    CREATE TABLE IF NOT EXISTS fund_weights (
        fund_id INTEGER NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
        ticker  TEXT NOT NULL,
        weight  REAL NOT NULL,
        PRIMARY KEY (fund_id, ticker)
    ) WITHOUT ROWID;
`)

// Derived table, calculated once for every new uploaded etf
db.exec(`
   CREATE TABLE IF NOT EXISTS fund_prices (
        fund_id INTEGER NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
        date    TEXT NOT NULL,
        price   REAL NOT NULL,
        PRIMARY KEY (fund_id, date)
    ) WITHOUT ROWID;
`)

export default db;