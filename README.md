# Dev Tab Organizer ⚡

> Automatically label your localhost tabs by service name — zero config, instant value.

![Labeled localhost tabs](./assets/screenshot-tab-bar.png)

## What it does

Tired of squinting at 10 identical "localhost" tabs? Dev Tab Organizer rewrites each
localhost tab title to include the port number and service name: `⚡ 3000 — React`,
`⚡ 8080 — Spring Boot`, `⚡ 5173 — Vite`. Works instantly on install — no setup required.

## Install

[Install from Chrome Web Store](#) Not yet approved from Google - you can try it from local install.

## Default Port Map

| Port | Service |
|------|---------|
| 1234 | Parcel |
| 3000 | React |
| 3001 | Node / API |
| 4000 | Phoenix |
| 4200 | Angular |
| 5000 | Flask |
| 5173 | Vite |
| 8000 | Django / FastAPI |
| 8080 | Spring Boot |
| 8888 | Jupyter |
| 9000 | Webpack |

Don't see your stack? Adding a new entry is one line in `port-map.js`.

## Popup — Custom Names & Pause/Resume

Click the extension icon to open the popup:

![Popup UI showing custom port names and pause button](./assets/screenshot-popup-v1.0.0.png)

- **Rename any port** by clicking its input and typing a custom name — saved automatically on blur or Enter
- **Clear a custom name** to revert to the default mapping
- **Pause** the extension temporarily (e.g., during screen recordings) — existing titles are retained

The popup follows your system/browser dark or light theme (`prefers-color-scheme`); no theme preference is stored.

## Load unpacked (local development)

1. Clone this repository: `git clone git@github.com:Gancio-xyz/dev-tab-organizer.git`
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `extension/` folder inside the cloned repository
5. Open any `localhost:PORT` tab — the title updates immediately

> **Note for contributors:** The `extension/` directory is the canonical runtime bundle. Keep `_bmad` and other tooling folders outside this bundle.

## License

MIT — see [LICENSE](./LICENSE)
