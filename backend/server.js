import path from 'path';
import db from './db.js';
import { loadPrices } from './loadPrices.js';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

loadPrices(db, path.join(import.meta.dirname, 'data', 'Prices.csv'));

app.use(cors({
    origin: 'http://localhost:3000' 
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: `Backend server is running on port ${PORT}` });
});

const insertFund = db.prepare('INSERT INTO funds (name) VALUES (?) RETURNING id');
const insertFundWeights = db.prepare('INSERT INTO fund_weights (fund_id, ticker, weight) VALUES (?, ?, ?)');
const findFundByName = db.prepare('SELECT id FROM funds WHERE name = ?');
const findFundById = db.prepare('SELECT * FROM funds WHERE id = ?');
const getFundWeights = db.prepare('SELECT ticker, weight FROM fund_weights WHERE fund_id = ?');
const getFundRecentHoldings = db.prepare(`
    SELECT w.ticker, w.weight, p.close
    FROM fund_weights w
    JOIN prices p ON p.ticker = w.ticker
    WHERE w.fund_id = ?
    AND p.date = (SELECT MAX(date) FROM prices);
`)
const getFundPriceOverTime = db.prepare(`
    SELECT p.date, SUM(p.close * w.weight) AS fund_close
    FROM fund_weights w
    JOIN prices p ON p.ticker = w.ticker
    WHERE p.date BETWEEN :from AND :to AND w.fund_id = :fundId
    GROUP BY p.date
    HAVING COUNT(*) = (SELECT COUNT(*) FROM fund_weights WHERE fund_id = :fundId)
    ORDER BY p.date;
`)
const getFundPriceOverTimeAll = db.prepare(`
    SELECT p.date, SUM(p.close * w.weight) AS fund_close
    FROM fund_weights w
    JOIN prices p ON p.ticker = w.ticker
    WHERE w.fund_id = :fundId
    GROUP BY p.date
    HAVING COUNT(*) = (SELECT COUNT(*) FROM fund_weights WHERE fund_id = :fundId)
    ORDER BY p.date;
`)

// Upload a fund
app.post('/api/etf', (req, res) => {
    const { name, entries } = req.body ?? {}; // entries is a list of { ticker: string, weight: number; }

    if (typeof name !== 'string' || !name.trim() || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Expected { ticker: string, entries: array }' });
    }

    const cleanedFundName = name.trim().toUpperCase();
    const cleanedEntries = entries.map((entry) => ({ticker: entry.ticker.trim().toUpperCase() , weight: entry.weight}))

    if (findFundByName.get(cleanedFundName)) {
        return res.status(409).json({ error: `ETF '${cleanedFundName}' already exists` });
        // update this to add to the fund, instead of error
    }

    const saveETFs = db.transaction(() => {
        const { id } = insertFund.get(cleanedFundName);
        for (const { ticker, weight } of cleanedEntries) {
            insertFundWeights.run(id, ticker, weight);
        }
        return id;
    });

    try {
        const id = saveETFs();
        res.status(201).json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// Get a fund's holdings and weights
app.get('/api/etf/:id', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'id must be an integer' });
    }

    const fund = findFundById.get(id);
    if (!fund) {
        return res.status(404).json({ error: `ETF ${id} doesn't exist` });
    }

    res.json({ id: id, name: fund.name, entries: getFundWeights.all(id) });
})

// Delete a fund
app.delete('/api/etf/:id', (req, res) => {

})

// Get the most recent set of holdings for a fund
app.get('/api/etf/:id/recentHoldings', (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'id must be an integer' });
    }
    
    const fund = findFundById.get(id);
    if (!fund) {
        return res.status(404).json({ error: `ETF ${id} doesn't exist` });
    }

    res.json({ id: id, name: fund.name, entries: getFundRecentHoldings.all(id) })
})

// Get the price over time for a fund
app.get('/api/etf/:id/pot', (req, res) => {
    // For ease of frontend development, should set default vals for optional parameters

    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'id must be an integer' });
    }

    const fund = findFundById.get(id);
    if (!fund) {
        return res.status(404).json({ error: `ETF ${id} doesn't exist` });
    }

    // Requires from and to values
    // TODO: Add behaviour for when optional values not supplied
    const {from, to} = req.query;
    
    if (!from || !to) {
        // If no date range given, return fund price over lifetime
        res.json({ id: id, name: fund.name, entries: getFundPriceOverTimeAll.all({ fundId: id })});
    } else {
        // if date range given, return fund price over date range
        if (from > to) {
            return res.status(400).json({ error: "From must not be after to" });
        }

        // Can calculate lazily, cache unique queried values as the queries come in to save on compute. 
        res.json({ id: id, name: fund.name, entries: getFundPriceOverTime.all({ fundId: id, from: from, to: to })});
    }

})

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});
