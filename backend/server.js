const express = require('express');
const db = require('./db');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: 'http://localhost:3000' 
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running perfectly on port 4000!' });
});

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});
