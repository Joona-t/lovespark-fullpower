# LoveSpark Popup Fortress

Aggressive popup and redirect blocker that overrides browser APIs to stop unwanted windows.

> **Personal Use Only** — This extension is not on the Chrome Web Store. Sideload at your own risk. It uses aggressive techniques that may break some websites.

## What It Does

- **window.open Override:** Intercepts and blocks `window.open()` calls in page context
- **Location Override:** Blocks `location.assign()` and `location.replace()` redirects
- **Meta Refresh Blocking:** Removes `<meta http-equiv="refresh">` tags
- **declarativeNetRequest:** Static rules to block known popup/redirect network patterns
- **CSS Layer:** Hides overlay-style popup elements
- **Daily Stats:** Tracks how many popups were blocked (stored locally, never sent anywhere)

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
| `declarativeNetRequest` | Block known popup/redirect network requests |
| `storage` | Persist counter stats and toggle state locally |
| `host_permissions: <all_urls>` | Must run on every website to intercept popups |

## Privacy

- **Zero data collection.** No analytics, no telemetry, no outbound network calls.
- **All data stays local.** Counters and settings use `chrome.storage.local` only.
- **No remote code.** All scripts are bundled locally.
- **Fully auditable.** Every file is plain JS/CSS/JSON — read it yourself.

## License

MIT — part of the [LoveSpark](https://github.com/Joona-t) suite.
