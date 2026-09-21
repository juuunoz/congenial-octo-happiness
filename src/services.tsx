import { ETFEntry, ETFHistoryEntry } from './types';

const backend = process.env.REACT_APP_BACKEND_ADDR;

// Get the fund price over time for all the holdings in the ETF idenfified by id
export function ETFGetPOT(id: number): Promise<{ id: number, name: string, entries: ETFHistoryEntry[] }> {
    return fetch(`${backend}/api/etf/${id}/pot`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    })
    .then(data => {
        console.log(data);
        return data;
    })
    .catch(error => {
        console.error('Fetch failed:', error);
        throw error;
    });
}

// Get the most recent close for all the holdings in the ETF identified by id
export function ETFGetRecentClose(id: number): Promise<{ id: number, name: string, entries: ETFEntry[] }> {
    return fetch(`${backend}/api/etf/${id}/recentHoldings`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return response.json();
    })
    .then(data => {
        console.log(data);
        return data
    })
    .catch(error => {
        console.error('Fetch failed:', error);
        throw error
    });
}

// Create an entry for the values in the etf file on the backend
export function ETFUPload(name: string, entries: ETFEntry[]): Promise<{ id: number }> {
    return fetch(`${backend}/api/etf`, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            entries: entries.map((entry) => ({
                ticker: entry.ticker,
                weight: entry.weight,
            })),
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        return response.json()
    })
    .then(data => {
        console.log(data)
        return data
    })
    .catch(error => {
        console.error('Fetch failed:', error);
        throw error
    });
}
