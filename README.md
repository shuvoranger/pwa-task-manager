# Daily Task Entry PWA

A minimal Progressive Web App to add tasks per day. Works offline, installable, and stores data in localStorage.

## Run locally
1. Serve the folder over HTTPS or HTTP (for local dev). Example using Node:
   ```bash
   npx serve
   ```
2. Open the URL shown (e.g. http://localhost:3000).
3. Add tasks, switch dates, and optionally click **Install App**.

## Files
- `index.html` – UI and layout
- `style.css` – styles
- `app.js` – logic (per-day tasks in localStorage)
- `manifest.json` – PWA manifest
- `service-worker.js` – offline caching
- `icons/` – app icons
