const express = require('express');
const path = require('path');
const app = express();

// Serve static files (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, '..'))); // serve files from project root

// Default route → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Export the Express app (Vercel handles the server)
module.exports = app;
