# LoveSpark YT Shield

Three-layer YouTube ad neutralizer that blocks ads at the network, API, and DOM level.

> **Personal Use Only** — This extension is not on the Chrome Web Store. Sideload at your own risk. YouTube may change their systems at any time, which could break this extension.

## What It Does

- **Layer 1 — declarativeNetRequest:** Static rules block known ad-serving URLs before they reach the page
- **Layer 2 — API Interception:** Overrides `fetch()` and `XMLHttpRequest` in page context to filter ad-related API responses
- **Layer 3 — Content Script Fallback:** MutationObserver watches for ad containers in the DOM and removes them
- **Daily Stats:** Tracks how many ads were neutralized (stored locally, never sent anywhere)

## Install (Sideload)

### Chrome / Edge / Brave

1. Download or clone this repo
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select this folder

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from this folder

> Firefox temporary add-ons are removed when the browser closes. For persistent install, use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/).

## Permissions

| Permission | Why |
|------------|-----|
| `alarms` | Hourly check for daily counter reset |
| `declarativeNetRequest` | Block known YouTube ad-serving URLs at the network level |
| `storage` | Persist counter stats and toggle state locally |
| `host_permissions: youtube.com, googlevideo.com` | Scoped to YouTube only — no access to other sites |

## Privacy

- **Zero data collection.** No analytics, no telemetry, no outbound network calls.
- **All data stays local.** Counters and settings use `chrome.storage.local` only.
- **No remote code.** All scripts are bundled locally.
- **Fully auditable.** Every file is plain JS/CSS/JSON — read it yourself.

## License

MIT — part of the [LoveSpark](https://github.com/Joona-t) suite.
