// Simulated React library from CDN (Port 6000 - StaticHost)
(function () {
  console.log('React v1.0.0 loaded from CDN (Port 6000)');

  // Mock React global (simplified)
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

  if (window.setStatus) {
    window.setStatus('cdn-status', 'green', 'CDN :6000');
  }
})();
