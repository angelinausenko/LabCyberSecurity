const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 6000;

// StaticHost always allows all origins — it's a CDN
// In a real scenario you'd restrict this to trusted domains
app.use(cors());

// Serve all static assets
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`[System] StaticHost CDN running at http://localhost:${PORT}`);
  console.log(`[System] Serving: react-mock.js, theme.css, logo.png`);
});
