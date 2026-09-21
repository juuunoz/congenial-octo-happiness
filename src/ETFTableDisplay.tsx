import { ETFEntry } from "./types";
import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { ETFGetRecentClose } from "./services";

type SortOrder = "weightDesc" | "weightAsc" | "tickerAsc" | "tickerDesc";
const comparators: Record<SortOrder, (a: ETFEntry, b: ETFEntry) => number> = {
        weightDesc: (a, b) => b.weight - a.weight,
        weightAsc: (a, b) => a.weight - b.weight,
        tickerAsc: (a, b) => a.ticker.localeCompare(b.ticker),
        tickerDesc: (a, b) => b.ticker.localeCompare(a.ticker),
    };

function ETFTableDisplay({ etfId }: { etfId: number}) {
    const [sortOrder, setSortOrder] = useState<SortOrder>("weightAsc");
    const [ETFValues, setETFValues] = useState<ETFEntry[]>([])
    
    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setSortOrder(event.target.value as SortOrder)
    };

    const sortedETFValues = useMemo(
        () => [...ETFValues].sort(comparators[sortOrder]),
        [ETFValues, sortOrder]
    );

    useEffect(() => {
        if (etfId != -1) 
            ETFGetRecentClose(etfId)
                .then((response) => {
                    setETFValues(response.entries)
                })
    }, [etfId])

    return (
        <div id="etf-display" className="col-span-1 ">
            
            {/* Table rendering */}
            <select className="text-xl outline-1 bg-black text-white p-1" 
            onChange={handleSelect}>
            <option value="weightAsc">weight lowest to highest</option>
            <option value="weightDesc">weight highest to lowest</option>
            <option value="tickerAsc">ticker alphabetical (A-Z)</option>
            <option value="tickerDesc">ticker alphabetical (Z-A)</option>
            </select>
            <table className="border-collapse border border-black">
            <thead>
                <tr>
                <th className="border border-black px-3 py-1 text-left">Ticker</th>
                <th className="border border-black px-3 py-1 text-right">Weight</th>
                <th className="border border-black px-3 py-1 text-right">Latest Close</th>
                </tr>
            </thead>
            <tbody>
                {sortedETFValues.map((val: ETFEntry) => (
                <tr key={val.ticker}>
                    <td className="border border-black px-3 py-1">{val.ticker}</td>
                    <td className="border border-black px-3 py-1 text-right">{val.weight}</td>
                    <td className="border border-black px-3 py-1 text-right">{val.close}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )
}

export default ETFTableDisplay;