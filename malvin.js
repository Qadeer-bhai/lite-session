const express = require('express');
const app = express();
const path = require('path');
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Increase listener limit
require('events').EventEmitter.defaultMaxListeners = 500;

// Define routes
const pairRouter = require('./pair');
const qrRouter = require('./qr');

// Mount API routes
app.use('/get-code', pairRouter); // For pairing code logic
app.use('/get-qr', qrRouter);     // For QR code logic

// Serve static HTML files
app.use('/pair', (req, res) => {
    res.sendFile(path.join(__path, 'pair.html'));
});

app.use('/qr', (req, res) => {
    res.sendFile(path.join(__path, 'qr.html'));
});

// Serve the main index page at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__path, 'index.html'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`
Deployment Successful🚨

Server Running on http://localhost:` + PORT);
});

module.exports = app;