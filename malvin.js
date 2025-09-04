const express = require('express');
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

require('events').EventEmitter.defaultMaxListeners = 500;

// Import routes
let code = require('./pair');
let qr = require('./qr');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/code', code);   // Pair system
app.use('/qr', qr);       // QR system

// Default route → index.html
app.use('/', async (req, res) => {
    res.sendFile(__path + '/index.html'); 
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 Deployment Successful

📌 Session-Server Running on http://localhost:${PORT}
➡️ Pair Login:   http://localhost:${PORT}/code
➡️ QR Login:     http://localhost:${PORT}/qr
➡️ Home Page:    http://localhost:${PORT}/
`)
});

module.exports = app;
