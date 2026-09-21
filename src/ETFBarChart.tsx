import { useEffect, useState, useMemo } from "react"
import { ETFEntry } from "./types";
import { ETFGetRecentClose } from "./services";

function ETFBarChart({ etfId }: { etfId: number }) {
    const [ETFValues, setETFValues] = useState<ETFEntry[]>([])

    const topFiveClose = useMemo(
            () => [...ETFValues].sort((a, b) => (b.close * b.weight) - (a.close * a.weight)).slice(0, 5),
            [ETFValues]
        );

    useEffect(() => {
        if (etfId != -1) 
            ETFGetRecentClose(etfId)
                .then((response) => {
                    setETFValues(response.entries)
                })
            
    }, [etfId])

    return (
        <div className="">
            five largest holdings (bar chart):
            <ul className="list-decimal list-inside">
                {topFiveClose.map((val: ETFEntry) => (
                    <li key={val.ticker}>
                        {val.ticker} {(val.weight * val.close).toFixed(3)}
                    </li>
                ))}
                
            </ul>
        </div>
    )
}

export default ETFBarChart