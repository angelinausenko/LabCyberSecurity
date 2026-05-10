// ── TrustCo Support Chat Widget (Port 4000) ──
(function () {
  console.log('[TrustCo] Support widget loaded from Port 4000');

  // ── Inject the Chat Button ──
  const btn = document.createElement('button');
  btn.id = 'support-chat-btn';
  btn.textContent = '💬 Chat with Support';
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, #4f8ef7, #1a3a8a);
    color: #fff;
    border: none;
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 0.85rem;
    font-family: Georgia, serif;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(79,142,247,0.4);
    z-index: 9000;
    transition: transform 0.15s, box-shadow 0.15s;
    letter-spacing: 0.02em;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 8px 28px rgba(79,142,247,0.55)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 20px rgba(79,142,247,0.4)';
  });

  // ── Chat Panel ──
  const panel = document.createElement('div');
  panel.id = 'support-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 24px;
    width: 300px;
    background: #171a23;
    border: 1px solid #2a2f45;
    border-radius: 12px;
    padding: 16px;
    font-family: Georgia, serif;
    font-size: 0.82rem;
    color: #e2e8f8;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    display: none;
    z-index: 8999;
  `;

  panel.innerHTML = `
    <div style="font-weight:bold;margin-bottom:8px;color:#4f8ef7">TrustCo Support</div>
    <div id="support-msg" style="color:#6b7394;font-style:italic">Checking for messages…</div>
    <div style="margin-top:12px;display:flex;gap:8px;">
      <input id="support-input" placeholder="Type a message…" style="
        flex:1; background:#0f1117; border:1px solid #2a2f45; border-radius:6px;
        color:#e2e8f8; padding:6px 10px; font-size:0.78rem; outline:none;
      "/>
      <button style="
        background:#4f8ef7; border:none; border-radius:6px; color:#fff;
        padding:6px 12px; cursor:pointer; font-size:0.78rem;
      ">Send</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ── Toggle panel & fetch messages ──
  btn.addEventListener('click', () => {
    const isOpen = panel.style.display === 'block';
    panel.style.display = isOpen ? 'none' : 'block';

    if (!isOpen) {
      checkMessages();
    }
  });

  async function checkMessages() {
    const msgEl = document.getElementById('support-msg');
    try {
      // fetch() to Port 4000 — this will fail without CORS headers in default mode
      const res = await fetch('http://localhost:4000/api/messages');
      const data = await res.json();
      msgEl.style.color = '#3ecf8e';
      msgEl.style.fontStyle = 'normal';
      msgEl.textContent = data.message || 'Agent is online.';
      console.log('[TrustCo] Message check OK:', data);

      if (window.setStatus) {
        window.setStatus('support-status', 'green', 'TrustCo :4000');
      }
    } catch (err) {
      msgEl.style.color = '#e05555';
      msgEl.style.fontStyle = 'italic';
      msgEl.textContent = 'Could not reach support (CORS blocked?).';
      console.error('[TrustCo] CORS/fetch error:', err);

      if (window.setStatus) {
        window.setStatus('support-status', 'red', 'TrustCo :4000');
      }
    }
  }

  if (window.setStatus) {
    window.setStatus('support-status', 'green', 'TrustCo :4000');
  }
})();
