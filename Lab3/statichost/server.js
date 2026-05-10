const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 6000;

// Parse CLI args: node server.js --mode breach
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode'));
const mode = modeArg
  ? (modeArg.includes('=') ? modeArg.split('=')[1] : args[args.indexOf(modeArg) + 1])
  : 'normal';

console.log(`[System] StaticHost CDN starting in mode: ${mode}`);

// CDN always allows all origins
app.use(cors());

// react-mock.js served dynamically based on mode:
//   normal  → v1.0.0  (good file; SRI hash was generated from this)
//   v1.0.1  → v1.0.1  (legitimate update; SRI hash in index.html will mismatch)
//   breach  → malicious alert (SRI mismatch → browser blocks if SRI active)
app.get('/react-mock.js', (req, res) => {
  res.type('application/javascript');

  if (mode === 'breach') {
    console.log('[StaticHost] WARNING: BREACH MODE — serving malicious react-mock.js');
    res.send(
`// react-mock.js — COMPROMISED VERSION (Port 6000 breach mode)
(function () {
  alert("CRITICAL: CDN Compromised! Stealing data...");
})();
`
    );

  } else if (mode === 'v1.0.1') {
    console.log('[StaticHost] Serving react-mock.js v1.0.1 (legitimate update)');
    res.send(
`// Simulated React library from CDN (Port 6000 - StaticHost)
(function () {
  console.log('React v1.0.1 loaded from CDN (Port 6000)');
  window.React = {
    version: '1.0.1 (mock)',
    createElement: function (tag, props, ...children) {
      const el = document.createElement(tag);
      if (props) {
        Object.entries(props).forEach(([k, v]) => {
          if (k === 'className') el.className = v;
          else if (k === 'style') Object.assign(el.style, v);
          else el.setAttribute(k, v);
        });
      }
      children.flat().forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child instanceof Element) el.appendChild(child);
      });
      return el;
    }
  };
  if (window.setStatus) window.setStatus('cdn-status', 'green', 'CDN :6000');
})();
`
    );

  } else {
    // normal — v1.0.0
    console.log('[StaticHost] Serving react-mock.js v1.0.0 (normal)');
    res.send(
`// Simulated React library from CDN (Port 6000 - StaticHost)
(function () {
  console.log('React v1.0.0 loaded from CDN (Port 6000)');
  window.React = {
    version: '1.0.0 (mock)',
    createElement: function (tag, props, ...children) {
      const el = document.createElement(tag);
      if (props) {
        Object.entries(props).forEach(([k, v]) => {
          if (k === 'className') el.className = v;
          else if (k === 'style') Object.assign(el.style, v);
          else el.setAttribute(k, v);
        });
      }
      children.flat().forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child instanceof Element) el.appendChild(child);
      });
      return el;
    }
  };
  if (window.setStatus) window.setStatus('cdn-status', 'green', 'CDN :6000');
})();
`
    );
  }
});

// Serve remaining static assets (theme.css, logo.png)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`[System] StaticHost CDN running at http://localhost:${PORT}`);
  console.log(`[System] Serving: react-mock.js (${mode}), theme.css, logo.png`);
  if (mode === 'breach') {
    console.log('[System] WARNING: CDN is serving a MALICIOUS react-mock.js!');
  }
});
