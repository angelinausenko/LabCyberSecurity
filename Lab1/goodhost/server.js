const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Read config and version on startup
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const version = fs.readFileSync(path.join(__dirname, 'version.txt'), 'utf8').trim();

console.log(`[System] Starting ${config.appName} v${version}...`);
console.log(`[System] Mode: ${config.mode}`);

// Apply CORS only if mode is "mode1"
if (config.mode === 'mode1') {
  app.use(cors()); // Allow all origins with *
  console.log('[System] CORS enabled for ALL origins (mode1 - wide open)');
} else {
  console.log('[System] CORS NOT enabled (default mode) - SOP is active');
}

// Email data
const emails = [
  {
    id: 1,
    sender: 'alice@example.com',
    subject: 'Project Update - Q2 Report Ready',
    body: 'Hi John,\n\nThe Q2 report is now finalized and ready for your review. Please find the attached summary below.\n\nTotal Revenue: $1.2M\nGrowth: +18% YoY\n\nLet me know if you need any changes.\n\nBest,\nAlice'
  },
  {
    id: 2,
    sender: 'bob@devteam.io',
    subject: 'Security Patch Deployment - Action Required',
    body: 'Hello John,\n\nWe need to deploy the critical security patch to production by EOD Friday. The patch addresses CVE-2024-1234 which affects our authentication module.\n\nPlease approve the deployment request at your earliest convenience.\n\nThanks,\nBob\nDevOps Team'
  },
  {
    id: 3,
    sender: 'newsletter@techdigest.com',
    subject: 'This Week in Tech: AI Breakthroughs & Browser Security',
    body: 'Good morning!\n\nThis week\'s highlights:\n\n• Researchers reveal new CORS misconfiguration vulnerabilities in major platforms\n• Browser vendors announce stricter SameSite cookie defaults\n• Zero-day exploit discovered in popular CDN provider\n\nRead more at techdigest.com\n\nUnsubscribe | Manage Preferences'
  }
];

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API: Get emails list
app.get('/api/emails', (req, res) => {
  const emailList = emails.map(({ id, sender, subject }) => ({ id, sender, subject }));
  res.json(emailList);
});

// API: Get single email
app.get('/api/emails/:id', (req, res) => {
  const email = emails.find(e => e.id === parseInt(req.params.id));
  if (!email) return res.status(404).json({ error: 'Email not found' });
  res.json(email);
});

app.listen(PORT, () => {
  console.log(`[System] ${config.appName} running at http://localhost:${PORT}`);
});
