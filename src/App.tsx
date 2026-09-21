import { useState, ChangeEvent } from 'react';


type ETFEntry = { ticker: string, weight: number; latestClose: number };

function App() {
  const [ETFVals, setETFVals] = useState<ETFEntry[]>([])
  const loadingETF: ETFEntry[] = [];

  // Processes ETFFile input file data
  const handleETFFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        loadingETF.push({'ticker': entry[cols['ticker']], 'weight': parseFloat(entry[cols['weight']]), 'latestClose': -1 })
      }
    }

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/); 

      for (const line of lines) processLine(line)
    } catch (error) {
      event.target.value = '';
      console.error('Error reading file stream:', error);
    }
    setETFVals(loadingETF)
  };

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const copy = [...ETFVals]

    switch (event.target.value) {
      case 'none': setETFVals(copy); break;
      case 'weight-asc':  setETFVals(copy.sort((a, b) => a.weight - b.weight)); break;
      case 'weight-desc': setETFVals(copy.sort((a, b) => b.weight - a.weight)); break;
      case 'ticker-alph': setETFVals(copy.sort((a, b) => a.ticker.localeCompare(b.ticker))); break;
    }
  };

  const stockHistoryFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let cols: Record<string, number> | null = null
    let partialLine = '';
    const processLine = (rawLine: string) => {
      const line = rawLine.replace(/\r$/, '');
      if (!line.trim()) return; // skip line if it's empty

      // Process first line as header
      if (cols === null) {
        const header = line.replace(/^\uFEFF/, '').split(',')
          .map((h) => h.trim().toLowerCase());

        cols = {}
        for (const [index, ticker] of header.entries()) {
          cols[ticker] = index
        }

        if (!('date' in cols))
          throw new Error('Price history must have "date" column');
        return;
      }
      else {
        const entry = line.replace(/^\uFEFF/, '').split(',')
          .map((h) => h.trim());
        console.log(entry[cols['B']]) //FIXME: NOT PRINTING AT ALL?
      }
    }

    try {
      while ( true ) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the current chunk and combine with any leftover text
        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split('\n');

        // Save the last potentially incomplete line for the next iteration
        partialLine = lines.pop() ?? '';

        for (const line of lines) processLine(line)
        //TODO: need to save info for last line
      }

    } catch (error) {
      event.target.value = '';
      console.error('Error reading file stream:', error);
    }
  }

  return (
    <div className="m-5 grid grid-cols-6 gap-2">
      <div id="file-inserts" className="text-xl col-span-1">
        <div className="ml-auto mr-auto">
          <div>insert etf</div>
          <input
            type="file"
            accept=".csv"
            onChange={handleETFFileChange}
          />
        </div>

        <div className="mt-5">
          five largest holdings:
          <ul className="list-decimal list-inside">
            <li>test: value</li>
          </ul>
        </div>
      </div>

      <div id="etf-display" className="col-span-1 ">
        <select className="text-xl outline-1 bg-transparent" 
          onChange={handleSelect}>
          <option value="none">none</option>
          <option value="weight-asc">weight lowest to highest</option>
          <option value="weight-desc">weight highest to lowest</option>
          <option value="ticker-alph">ticker alphabetical</option>
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
            {ETFVals.map((val: ETFEntry) => (
              <tr key={val.ticker}>
                <td className="border border-black px-3 py-1">{val.ticker}</td>
                <td className="border border-black px-3 py-1 text-right">{val.weight}</td>
                <td className="border border-black px-3 py-1 text-right">{val.latestClose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xl col-auto">
        graph
      </div>
    </div>
  );
}

export default App;