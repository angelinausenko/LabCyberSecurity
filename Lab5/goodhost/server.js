const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Config & version ──────────────────────────────────────────────────────────
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const version = fs.readFileSync(path.join(__dirname, 'version.txt'), 'utf8').trim();

console.log(`[System] Starting ${config.appName} v${version}...`);
console.log(`[System] Mode: ${config.mode}`);

// ── Session store (in-memory, two users) ─────────────────────────────────────
const USERS = {
  john:  { password: 'pass123', displayName: 'John Smith',   sessionId: 'sess-john-abc123'  },
  alice: { password: 'pass456', displayName: 'Alice Johnson', sessionId: 'sess-alice-xyz789' }
};

// Map sessionId → user for server-side lookups
const SESSIONS = Object.fromEntries(
  Object.values(USERS).map(u => [u.sessionId, u])
);

// ── Cookie flag configuration per mode ───────────────────────────────────────
//
//  cookie-naive      →  No flags at all. JS-readable, sent everywhere.
//  cookie-httponly   →  HttpOnly added.  JS can no longer read it.
//  cookie-path       →  HttpOnly + Path=/api. Only sent with /api/* requests.
//  (any other mode)  →  Falls back to a safe default (HttpOnly + SameSite=Lax)
//
function buildCookieHeader(sessionId, mode) {
  const base = `SessionID=${sessionId}`;
  switch (mode) {
    case 'cookie-naive':
      // Task 1: bare minimum — no flags
      return `${base}; Path=/`;
    case 'cookie-httponly':
      // Task 3: HttpOnly prevents JS access
      return `${base}; Path=/; HttpOnly`;
    case 'cookie-path':
      // Task 4: scope restricted to /api
      return `${base}; Path=/api; HttpOnly`;
    case 'cookie-secure':
      // Lab 5 Task 1: HttpOnly only — proxy can still see it over plain HTTP
      return `${base}; Path=/; HttpOnly`;
    case 'cookie-secure-httponly':
      // Lab 5 Task 2: HttpOnly + Secure — browser refuses to send over plain HTTP
      // Via the proxy (http://localhost:8080) the cookie will NOT be transmitted
      return `${base}; Path=/; HttpOnly; Secure; SameSite=Strict`;
    default:
      // Safe fallback used in all Lab 1–3 modes
      return `${base}; Path=/; HttpOnly; SameSite=Lax`;
  }
}

// ── CORS (mode1) ──────────────────────────────────────────────────────────────
if (config.mode === 'mode1') {
  app.use(cors());
  console.log('[System] CORS enabled for ALL origins (mode1)');
}

// ── CSP: Strict ───────────────────────────────────────────────────────────────
if (config.mode === 'csp-strict') {
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  });
  console.log('[System] CSP STRICT — only :3000 trusted');
}

// ── CSP: Balanced (shared by csp-balanced, mode-insecure, mode-sri-active,
//                            cookie-naive, cookie-httponly, cookie-path) ───────
const BALANCED_CSP_MODES = [
  'csp-balanced', 'mode-insecure', 'mode-sri-active',
  'cookie-naive', 'cookie-httponly', 'cookie-path',
  'cookie-secure', 'cookie-secure-httponly'
];
if (BALANCED_CSP_MODES.includes(config.mode)) {
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "img-src *",
        "style-src *",
        "script-src 'self' http://localhost:4000 http://localhost:5000 http://localhost:6000"
        // NOTE: Port 5000 is intentionally included for Lab 4 cookie theft demo.
        // In cookie-httponly / cookie-path modes the script runs but finds no cookie.
      ].join('; ')
    );
    next();
  });
}

// ── SRI ───────────────────────────────────────────────────────────────────────
const SRI_HASHES = {
  'v1.0.0': 'sha256-lE652fYvi4GAu7W8gqBDE0S3ARfdbJsnkEyrHAZVfO8=',
  'v1.0.1': 'sha256-Jsp2Ryouk6tnfOY/RYcoUvajMZb0qmg1ees8mkbG9V4='
};
const ACTIVE_SRI_VERSION = config.sriVersion || 'v1.0.0';
const ACTIVE_SRI_HASH    = SRI_HASHES[ACTIVE_SRI_VERSION];

// ── Dynamic index.html (SRI / insecure modes) ─────────────────────────────────
if (config.mode === 'mode-insecure' || config.mode === 'mode-sri-active') {
  app.get('/', (req, res) => {
    let html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    if (config.mode === 'mode-sri-active') {
      html = html.replace(
        '<script src="http://localhost:6000/react-mock.js"></script>',
        `<script src="http://localhost:6000/react-mock.js" integrity="${ACTIVE_SRI_HASH}" crossorigin="anonymous"></script>`
      );
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
}

// ── LOGIN endpoint ────────────────────────────────────────────────────────────
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username?.toLowerCase()];

  if (!user || user.password !== password) {
    console.log(`[Auth] Failed login attempt for: ${username}`);
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const cookieHeader = buildCookieHeader(user.sessionId, config.mode);
  res.setHeader('Set-Cookie', cookieHeader);

  console.log(`[Auth] Login OK — user: ${user.displayName}`);
  console.log(`[Auth] Set-Cookie: ${cookieHeader}`);
  console.log(`[Auth] Cookie mode: ${config.mode}`);

  res.json({ ok: true, displayName: user.displayName, mode: config.mode });
});

// ── LOGOUT endpoint ───────────────────────────────────────────────────────────
app.post('/logout', (req, res) => {
  // Expire the cookie by setting Max-Age=0
  res.setHeader('Set-Cookie', 'SessionID=; Path=/; Max-Age=0; HttpOnly');
  res.setHeader('Set-Cookie', 'SessionID=; Path=/api; Max-Age=0; HttpOnly');
  console.log('[Auth] User logged out — session cookie cleared');
  res.json({ ok: true });
});

// ── WHO-AM-I endpoint (reads session from cookie) ─────────────────────────────
app.get('/api/whoami', (req, res) => {
  const raw = req.headers.cookie || '';
  const match = raw.match(/SessionID=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'Not authenticated' });

  const user = SESSIONS[match[1]];
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  res.json({ displayName: user.displayName });
});

// ── Email data ────────────────────────────────────────────────────────────────
const emails = [
  {
    id: 1,
    sender: 'alice@example.com',
    subject: 'Project Update - Q2 Report Ready',
    body: 'Hi John,\n\nThe Q2 report is now finalized and ready for your review.\n\nTotal Revenue: $1.2M\nGrowth: +18% YoY\n\nBest,\nAlice'
  },
  {
    id: 2,
    sender: 'bob@devteam.io',
    subject: 'Security Patch Deployment - Action Required',
    body: 'Hello John,\n\nWe need to deploy the critical security patch to production by EOD Friday.\nThe patch addresses CVE-2024-1234 in our authentication module.\n\nThanks,\nBob'
  },
  {
    id: 3,
    sender: 'newsletter@techdigest.com',
    subject: 'This Week in Tech: Browser Security',
    body: 'Good morning!\n\n• New CORS misconfiguration vulnerabilities discovered\n• Browser vendors announce stricter SameSite cookie defaults\n• Zero-day in popular CDN provider\n\nRead more at techdigest.com'
  }
];

// ── Static & API ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/emails', (req, res) => {
  res.json(emails.map(({ id, sender, subject }) => ({ id, sender, subject })));
});

app.get('/api/emails/:id', (req, res) => {
  const email = emails.find(e => e.id === parseInt(req.params.id));
  if (!email) return res.status(404).json({ error: 'Not found' });
  res.json(email);
});

// Task 4 demo: a non-/api route to show cookie is NOT sent there
app.get('/other', (req, res) => {
  const raw = req.headers.cookie || '';
  const hasCookie = raw.includes('SessionID=');
  console.log(`[Path Test] GET /other — cookie present: ${hasCookie} | raw: "${raw}"`);
  res.json({
    path: '/other',
    cookieReceived: hasCookie,
    rawCookieHeader: raw || '(none)',
    note: 'In cookie-path mode, SessionID is scoped to Path=/api so it will NOT appear here'
  });
});

app.listen(PORT, () => {
  console.log(`[System] ${config.appName} running at http://localhost:${PORT}`);
});
