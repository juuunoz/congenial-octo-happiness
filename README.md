# how to run

step 1: in the root folder, run `npm install`

step 2: in  `/backend`, run `npm install`

step 3: in one process the  `/` (root folder): `npm run start`

step 3: in a separate process `/backend` (db folder): `node server.js`

# design choices

### on tooling:
* this app was made with React,  express and SQLite backend
* i chose my tech stack prioritizing speed over future scaleability.
* to this end, i chose SQLite specifically for startup simplicity.

i'm using a SQL db because the data is very structured and interrelated (etfs and prices).  i also needed to run complex and optimized calculations over many, many different entires (i.e for fund price over time) which was best done with SQL queries as well.

### on the codebase:
each item on the rubric was created in my project it's own component and named consistently (with `ETF` at the front). the logic in each component is enclosed, and they can all render different ETF data at the same time. developing this way helps with keeping the logic readable and organized. it also makes the components reusable which is good for scalability.

I abstracted api calls to `services.tsx` because this way i can later add parsers, error handling, loading states en masse to all my api calls easily. it also makes them reusable. i wrote all the calls in this file use the `fetch` api instead of `await` functions here because in some contexts, such as in `useEffect` where the thread can't be blocked, and i want `services.tsx` to be as broadly usable as possible. i can also attach await to a fetch() promise, but not the other way around.

the frontend does some input validation on the ETF files to make sure columns are not empty or malformed

the backend also does some input validation to make sure columns are not empty or malformed. it also does type checking before querying the database

the sql db is also pretty straightforward, with the exception of the query for `getFundPriceOverTimeAll`/`getFundPriceOverTime` i made a decision here to drop fund prices on the dates where not all the values for the ticker are present. this error is important to surface as it can be misleading otherwise. but it is not so important that the entire query should be aborted. i figured that most queries for the fund price would be to compare changes over time, i.e it's more about the bigger picture.

# assumptions
1. i noticed that in ETF files, some tickers had 0 weights. i rendered them anyways. 
2. when validating the ETF input files, i assumed that only files with a "name" and "weight" column would be valid.
3. an "interactable" table to me meant sorting, because this would give users more information that would otherwise be difficult to get from what was displayed on the screen alone. also it made the most sense to me for the given time frame.

# what is missing
1. re:interactive table; a cool feature that i thought about as i developed wouldve been editing the fund ticker, weight and close value, and seeing the changes propogate to the bar chart and graph. the changes would need to be cached on the frontend and sent to a PATCH endpoint and i would have to find a different way to trigger re-renders for the other components, so i decided against implementing it.

2. i didn't finish making the bar chart, but i implemented the backend calls necessary for producing the underlying data. i displayed the underlying data instead.

### on the frontend:
my next steps would have been to implement proper error handling for api errors. this would be a wrapper for the fetch calls in `services.tsx`.

also, for the time series graph, i wanted to load the data-points lazily as the user zooms out of the graph. the endpoint i use to load the data has functional `from` and `to` optional query parameters for this purpose. The ETF table could also be paginated.

lastly, i think being able to compare data for multiple ETFs on the screen at once or even on the same graph would've been useful. i organized my code around this feature but didn't implement it. 

### on the backend:
i also wanted to design a lazy-loaded cache for storing the etf price over time. currently the backend route for etf price over time takes optional `from` and `to` query parameters in the backend, and only calculates the values for that time slice. given more time, i would try to save the values in a `fund_prices` table after every calculation, and check the cache before starting an otherwise pretty costly calculation. in a production context with multiple users, this is also a value that would be queried a lot, which makes it a good candidate for cacheing

the backend currently loads `Prices.csv` from scratch on startup everytime. could add checking to see if the file has changed and potentially skip this step.

also there were some unused endpoints like for getting ETF data or deleting an ETF.

# ai usage
in this project, i used claude to help me choose a library for rendering charts and generating the component configurations for said chart. 

i also used it to generate `services.tsx` based off the backend `server.js` (but ended up editing most of it away) and the line cleaning/validation done in `processLine()` inside `handleETFChange`
