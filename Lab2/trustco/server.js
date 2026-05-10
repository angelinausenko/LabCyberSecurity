const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

// TrustCo partner server — allows cross-origin requests
// In mode1, this simulates a cooperative partner origin
app.use(cors());

// Serve static files (support.js)
app.use(express.static(path.join(__dirname, 'public')));

// API: Check for new support messages
app.get('/api/messages', (req, res) => {
  res.json({
    status: 'ok',
    newMessages: 0,
    agentOnline: true,
    message: 'No new messages. Support agent is available.'
  });
});

app.listen(PORT, () => {
  console.log(`[System] TrustCo Support running at http://localhost:${PORT}`);
});
