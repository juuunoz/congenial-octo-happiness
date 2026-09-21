import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export function loadPrices(db, csvPath) {
    const records = parse(fs.readFileSync(csvPath), {
    columns: (header) => header.map((h) => h.trim().toUpperCase()),
    skip_empty_lines: true,
    trim: true,
    });

    const insert = db.prepare('INSERT INTO prices (ticker, date, close) VALUES (?, ?, ?)');

    db.transaction(() => {
    db.exec('DELETE FROM prices');

    for (const record of records) {
        const { DATE, ...tickers } = record; 
        for (const [ticker, value] of Object.entries(tickers)) {
        if (value === '') continue; // blank cell = no price that day
        const close = Number(value);
        if (Number.isNaN(close)) throw new Error(`Bad price for ${ticker} on ${DATE}: ${value}`);
        insert.run(ticker, DATE, close);
        }
    }
    })();

    console.log(`Loaded ${records.length} rows from ${path.basename(csvPath)}`);
}