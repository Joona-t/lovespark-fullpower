# LoveSpark Cookie Nuke

Aggressive cookie consent banner removal for a cleaner browsing experience.

> **Personal Use Only** — This extension is not on the Chrome Web Store. Sideload at your own risk. It uses aggressive techniques that may break some websites.

## What It Does

- **CSS Layer:** Hides known cookie consent banners instantly via injected stylesheet
- **MutationObserver:** Watches for dynamically injected banners and removes them
- **Auto-Reject:** Clicks "Reject All" / "Decline" buttons when detected
- **declarativeNetRequest:** Blocks known consent SDK network requests before they load
- **Daily Stats:** Tracks how many banners were nuked (stored locally, never sent anywhere)

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
| `declarativeNetRequest` | Block consent SDK network requests before they load |
| `storage` | Persist counter stats and toggle state locally |
| `host_permissions: <all_urls>` | Must run on every website to catch cookie banners |

## Privacy

- **Zero data collection.** No analytics, no telemetry, no outbound network calls.
- **All data stays local.** Counters and settings use `chrome.storage.local` only.
- **No remote code.** All scripts are bundled locally.
- **Fully auditable.** Every file is plain JS/CSS/JSON — read it yourself.

## License

MIT — part of the [LoveSpark](https://github.com/Joona-t) suite.
