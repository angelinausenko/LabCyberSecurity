# Browser Security Foundations1
## Project Structure

```
Lab1/
├── goodhost/          → Port 3000  — SecureMail Pro (Main App)
├── statichost/        → Port 6000  — StaticHost CDN (CSS, JS, Logo)
├── trustco/           → Port 4000  — TrustCo Support Widget
├── weatherapp/        → Port 5000  — WeatherApp Widget (future attacker)
└── README.md
```
## Important Observations

- **`<script src="...">` tags are NOT blocked by CORS** — the browser executes them with full page access.
- **`fetch()` IS blocked by CORS** — unless the server sends the right `Access-Control-Allow-Origin` header.
- **`Access-Control-Allow-Origin: *`** allows any origin to read API responses, which is dangerous for authenticated endpoints.
- The attacker on Port 5000 can read `document.cookie` and `document.getElementById('username').innerText` because **script tags run in the same execution context** as the host page.