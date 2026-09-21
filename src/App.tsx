import { useState, ChangeEvent } from 'react';
import ETFTableDisplay from './ETFTableDisplay';
import { ETFEntry } from './types';
import ETFZoomableGraph from './ETFZoomableGraph';
import ETFBarChart from './ETFBarChart';
import { ETFUPload } from './services';

function App() {
  const [ETFId, setETFId] = useState<number>(-1)
  const loadingETF: ETFEntry[] = [];

  // Process and upload the file
  const handleETFFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const etfName = file.name.replace(/\.[^/.]+$/, '');
    let cols: Record<string, number> | null = null;

    // Processes CSV File line-by-line, transforms data into json
    const processLine = (rawLine: string): ETFEntry[] | undefined  => {
      const line = rawLine.replace(/\r$/, '');
      if (!line.trim()) return; // skip line if it's empty

      // Process first line as header
      if (cols === null) {
        const header = line.replace(/^\uFEFF/, '').split(',')
          .map((h) => h.trim().toLowerCase());
        cols = { ticker: header.indexOf('name'), weight: header.indexOf('weight') };
        
        if (cols.ticker === -1 || cols.weight === -1) {
          throw new Error('ETF must have "name" and "weight" columns');
        }
        return;
      }
      else {
        const entry = line.replace(/^\uFEFF/, '').split(',')
          .map((h) => h.trim());
        loadingETF.push({'ticker': entry[cols['ticker']], 'weight': parseFloat(entry[cols['weight']]), 'close': -1 })
      }
    }

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/); 

      for (const line of lines) processLine(line)

      ETFUPload(etfName, loadingETF)
        .then((response) => {
          setETFId(response.id)
        })
      
      event.target.value = ''
    } catch (error) {
      event.target.value = ''
      console.error('Error reading file stream:', error);
    }

  };

  return (
    <div className="m-5 grid grid-cols-6 gap-2">
      <div className="text-xl col-span-1">
        <div className="ml-auto mr-auto">
          <div>insert etf</div>
          <input
            type="file"
            accept=".csv"
            onChange={handleETFFileChange}
          />
        </div>

        <ETFBarChart etfId={ETFId}/>
      </div>

      <div className="text-xl col-span-1">
        <ETFTableDisplay etfId={ETFId}/>
      </div>

      
      <div className="text-xl col-span-4">
        <ETFZoomableGraph etfId={ETFId}/>
      </div>

    </div>
  );
}

export default App;