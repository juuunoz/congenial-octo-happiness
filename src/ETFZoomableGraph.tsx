import { useEffect, useState } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import { ETFHistoryEntry } from "./types";
import { ETFGetPOT } from "./services";

const Plot = createPlotlyComponent(Plotly);

export default function ETFZoomableGraph({ etfId }: { etfId: number }) {
  const [history, setHistory] = useState<ETFHistoryEntry[]>([]);

  useEffect(() => {
    if (etfId != -1) 
        ETFGetPOT(etfId)
            .then((response) => {
                    setHistory(response.entries)
                })
  }, [etfId]);

  return (
    <Plot
      data={[
        {
          x: history.map((d) => d.date),
          y: history.map((d) => d.fund_close),
          type: "scatter",
          mode: "lines",
        },
      ]}
      layout={{
        title: { text: "fund price over time" },
        xaxis: { type: "date", rangeslider: { visible: true } },
        yaxis: { fixedrange: true },
      }}
      config={{ scrollZoom: true, responsive: true }}
      style={{ width: "100%", height: 450 }}
      useResizeHandler
    />
  );
}
