// ── GoodHost Main Application Script (Port 3000) ──

// 1. Set Session Cookie
document.cookie = "SessionID=123456; path=/; SameSite=Lax";
console.log('[GoodHost] Session cookie set: SessionID=123456');

// 2. Fetch and render the email list
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

    // Update CDN status to green (if CSS loaded we can infer it)
    setStatus('cdn-status', 'green', 'CDN :6000');
    console.log('[GoodHost] Emails loaded successfully.');
  } catch (err) {
    console.error('[GoodHost] Failed to load emails:', err);
    document.getElementById('email-list').innerHTML =
      '<div class="loading" style="color:#e05555">Failed to load emails</div>';
  }
}

// 3. Open and display an email
async function openEmail(id, clickedItem) {
  // Highlight selected
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

// Helper: Escape HTML to prevent XSS in rendered content
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Helper: Update status bar indicator
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
  el.innerHTML = el.innerHTML; // preserve structure
}

// Expose setStatus globally for widgets
window.setStatus = setStatus;

// Boot
loadEmails();
