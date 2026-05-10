// ── GoodHost Main Application Script (Port 3000) ──

async function boot() {
  try {
    const res = await fetch('/api/whoami');
    if (res.ok) {
      const { displayName } = await res.json();
      showApp(displayName);
    } else {
      showLoginForm();
    }
  } catch {
    showLoginForm();
  }
}

// ── Login form ────────────────────────────────────────────────────────────────
function showLoginForm() {
  // Hide the mail app layout while we're logged out
  const appBody  = document.querySelector('.app-body');
  const userBar  = document.querySelector('.user-bar');
  if (appBody) appBody.style.display = 'none';
  if (userBar) userBar.style.display = 'none';

  // Remove any existing login overlay first
  document.getElementById('login-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #0f1117;
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; font-family: Georgia, serif;
  `;

  overlay.innerHTML = `
    <div style="
      background: #171a23; border: 1px solid #2a2f45; border-radius: 14px;
      padding: 40px 48px; width: 360px; box-shadow: 0 12px 48px rgba(0,0,0,0.6);
    ">
      <div style="text-align:center; margin-bottom:28px;">
        <div style="font-size:2rem; margin-bottom:8px;">✉</div>
        <h2 style="color:#4f8ef7; font-size:1.25rem; letter-spacing:0.04em;">SecureMail Pro</h2>
        <p style="color:#6b7394; font-size:0.78rem; margin-top:6px;">Sign in to your account</p>
      </div>

      <div style="margin-bottom:14px;">
        <label style="display:block; color:#6b7394; font-size:0.72rem; margin-bottom:5px; letter-spacing:0.08em; text-transform:uppercase;">Username</label>
        <input id="login-username" type="text" placeholder="john or alice"
          style="width:100%; background:#0f1117; border:1px solid #2a2f45; border-radius:7px;
                 color:#e2e8f8; padding:9px 12px; font-size:0.88rem; outline:none;
                 font-family:Georgia,serif; box-sizing:border-box;"
        />
      </div>

      <div style="margin-bottom:22px;">
        <label style="display:block; color:#6b7394; font-size:0.72rem; margin-bottom:5px; letter-spacing:0.08em; text-transform:uppercase;">Password</label>
        <input id="login-password" type="password" placeholder="••••••••"
          style="width:100%; background:#0f1117; border:1px solid #2a2f45; border-radius:7px;
                 color:#e2e8f8; padding:9px 12px; font-size:0.88rem; outline:none;
                 font-family:Georgia,serif; box-sizing:border-box;"
        />
      </div>

      <button id="login-btn"
        style="width:100%; background:linear-gradient(135deg,#4f8ef7,#1a3a8a); border:none;
               border-radius:8px; color:#fff; padding:11px; font-size:0.9rem; cursor:pointer;
               font-family:Georgia,serif; letter-spacing:0.03em; transition:opacity 0.15s;">
        Sign In
      </button>

      <div id="login-error" style="
        display:none; margin-top:14px; padding:9px 12px; background:#2a1515;
        border:1px solid #e05555; border-radius:7px;
        color:#e05555; font-size:0.78rem; text-align:center;
      "></div>

      <div style="margin-top:20px; padding:12px; background:#0f1117; border-radius:8px; border:1px solid #2a2f45;">
        <p style="color:#6b7394; font-size:0.7rem; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.08em;">Demo Credentials</p>
        <p style="color:#e2e8f8; font-size:0.75rem; font-family:'Courier New',monospace;">john  / pass123</p>
        <p style="color:#e2e8f8; font-size:0.75rem; font-family:'Courier New',monospace;">alice / pass456</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const usernameInput = overlay.querySelector('#login-username');
  const passwordInput = overlay.querySelector('#login-password');
  const loginBtn      = overlay.querySelector('#login-btn');
  const errorBox      = overlay.querySelector('#login-error');

  async function doLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      showError('Please enter username and password');
      return;
    }

    loginBtn.textContent = 'Signing in…';
    loginBtn.style.opacity = '0.7';
    loginBtn.disabled = true;

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Login failed');
        loginBtn.textContent = 'Sign In';
        loginBtn.style.opacity = '1';
        loginBtn.disabled = false;
        return;
      }

      // Success — server has set the cookie via Set-Cookie header
      console.log(`[Auth] Logged in as: ${data.displayName}`);
      console.log(`[Auth] Cookie mode: ${data.mode}`);
      console.log(`[Auth] Readable via document.cookie: "${document.cookie}"`);

      overlay.remove();
      showApp(data.displayName);

    } catch (err) {
      showError('Network error — is the server running?');
      loginBtn.textContent = 'Sign In';
      loginBtn.style.opacity = '1';
      loginBtn.disabled = false;
    }
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  loginBtn.addEventListener('click', doLogin);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  usernameInput.addEventListener('keydown', e => { if (e.key === 'Enter') passwordInput.focus(); });
  usernameInput.focus();
}

// ── Show main app after login ─────────────────────────────────────────────────
function showApp(displayName) {
  // Show hidden layout elements
  const appBody = document.querySelector('.app-body');
  const userBar = document.querySelector('.user-bar');
  if (appBody) appBody.style.display = '';
  if (userBar) userBar.style.display = '';

  // Update username display
  const usernameEl = document.getElementById('username');
  if (usernameEl) usernameEl.textContent = displayName;

  // Update user-bar
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) {
    const bar = document.querySelector('.user-bar');
    if (bar) {
      const btn = document.createElement('button');
      btn.id = 'logout-btn';
      btn.textContent = 'Sign out';
      btn.style.cssText = `
        margin-left:auto; background:none; border:1px solid #2a2f45;
        border-radius:5px; color:#6b7394; padding:3px 10px; cursor:pointer;
        font-size:0.72rem; font-family:Georgia,serif;
      `;
      btn.addEventListener('click', doLogout);
      bar.appendChild(btn);
    }
  }

  loadEmails();
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function doLogout() {
  await fetch('/logout', { method: 'POST' });
  // Hide the app
  document.querySelector('.app-body').style.display = 'none';
  document.querySelector('.user-bar').style.display  = 'none';
  document.getElementById('logout-btn')?.remove();
  showLoginForm();
}

// ── Fetch and render email list ───────────────────────────────────────────────
async function loadEmails() {
  try {
    const res = await fetch('/api/emails');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const emails = await res.json();

    const list = document.getElementById('email-list');
    list.innerHTML = '';

    emails.forEach(email => {
      const item = document.createElement('div');
      item.className = 'email-item';
      item.dataset.id = email.id;
      item.innerHTML = `
        <div class="email-sender">${escapeHtml(email.sender)}</div>
        <div class="email-subject">${escapeHtml(email.subject)}</div>
      `;
      item.addEventListener('click', () => openEmail(email.id, item));
      list.appendChild(item);
    });

    setStatus('cdn-status', 'green', 'CDN :6000');
    console.log('[GoodHost] Emails loaded.');
  } catch (err) {
    console.error('[GoodHost] Failed to load emails:', err);
    document.getElementById('email-list').innerHTML =
      '<div class="loading" style="color:#e05555">Failed to load emails</div>';
  }
}

// ── Open and display an email ─────────────────────────────────────────────────
async function openEmail(id, clickedItem) {
  document.querySelectorAll('.email-item').forEach(el => el.classList.remove('active'));
  clickedItem.classList.add('active');

  const view = document.getElementById('email-view');
  view.innerHTML = '<div class="loading">Loading…</div>';

  try {
    const res = await fetch(`/api/emails/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const email = await res.json();

    view.innerHTML = `
      <div class="email-view">
        <div class="email-view-header">
          <div class="email-view-subject">${escapeHtml(email.subject)}</div>
          <div class="email-view-meta">From: ${escapeHtml(email.sender)}</div>
        </div>
        <div class="email-view-body">${escapeHtml(email.body)}</div>
      </div>
    `;
  } catch (err) {
    console.error('[GoodHost] Failed to load email:', err);
    view.innerHTML = '<div class="loading" style="color:#e05555">Failed to load email</div>';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setStatus(id, color, label) {
  const el = document.getElementById(id);
  if (!el) return;
  const dot = el.querySelector('.dot');
  if (dot) {
    dot.className = 'dot';
    if (color === 'green') dot.style.background = '#3ecf8e';
    if (color === 'red')   dot.style.background = '#e05555';
    if (color === 'warn')  dot.style.background = '#f0a500';
  }
}

window.setStatus = setStatus;

// ── Boot ──────────────────────────────────────────────────────────────────────
boot();
