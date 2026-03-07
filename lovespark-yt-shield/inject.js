'use strict';

// ============================================================
// LoveSpark YouTube Shield — Layer 2: MAIN World Injector
// Intercepts YouTube's player API responses and strips ad data
// BEFORE the player ever sees it. No ads load = no detection.
// ============================================================

(function() {

  // All known ad-related keys in YouTube's player/next API responses.
  // Removing these from the JSON means the player has no ad config
  // to act on — it simply plays the video.
  const AD_KEYS = [
    'adPlacements',
    'adSlots',
    'playerAds',
    'adBreakParams',
    'adBreakHeartbeatParams',
    'instreamAdBreakConfig',
    'linearAdSequenceRenderer',
    'instreamVideoAdRenderer',
    'adPlacementRenderer',
    'adBreakServiceRenderer',
    'promotedSparklesWebRenderer',
    'searchPyvRenderer',
    'promotedSparklesTextSearchRenderer',
    'adSlotRenderer',
    'playerLegacyDesktopWatchAdsRenderer',
    'adLayoutLoggingData',
    'invideoOverlayAdRenderer',
    'bannerPromoRenderer',
    'statementBannerRenderer',
    'promotedVideoRenderer',
    'sparklesPlayerResponse',
    'adPlacements',
    'adBreakAutoPlayParams',
  ];

  // Keys that indicate adblock detection messaging
  const ADBLOCK_DETECT_STRINGS = [
    'ad blockers',
    'ad blocker',
    'adblock',
    'Ad blockers violate',
    'allow YouTube ads',
  ];

  /**
   * Recursively strip ad-related keys from a YouTube API response object.
   * Operates in-place for performance — no cloning.
   */
  function stripAds(obj) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        stripAds(obj[i]);
      }
      return;
    }

    for (const key of AD_KEYS) {
      if (key in obj) delete obj[key];
    }

    // Neuter adblock detection messages in playability status
    if (obj.playabilityStatus) {
      const status = obj.playabilityStatus;
      const reason = status.reason || '';
      const subreason = status.messages?.[0] || '';
      const combined = reason + subreason;

      for (const needle of ADBLOCK_DETECT_STRINGS) {
        if (combined.toLowerCase().includes(needle.toLowerCase())) {
          // Clear the block — make video playable again
          status.status = 'OK';
          delete status.reason;
          delete status.messages;
          delete status.errorScreen;
          delete status.playabilityStatus;
          break;
        }
      }
    }

    // Recurse into all values
    for (const val of Object.values(obj)) {
      stripAds(val);
    }
  }

  // ---- Patch fetch() ----
  // YouTube's modern player loads config via fetch() to /youtubei/v1/player
  // and /youtubei/v1/next. We intercept the response, parse it, strip ads,
  // and return the cleaned JSON. The player never knows ads existed.

  const _origFetch = window.fetch;

  window.fetch = async function(...args) {
    const url = (args[0] instanceof Request) ? args[0].url : String(args[0]);

    const response = await _origFetch.apply(this, args);

    // Only intercept YouTube player/next API calls
    if (!url.includes('/youtubei/v1/player') && !url.includes('/youtubei/v1/next')) {
      return response;
    }

    try {
      const clone = response.clone();
      const json = await clone.json();

      stripAds(json);

      return new Response(JSON.stringify(json), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (_) {
      // If JSON parse fails, return original response untouched
      return response;
    }
  };

  // ---- Patch XMLHttpRequest ----
  // Legacy codepath — some YouTube embeds and older player versions
  // still use XHR instead of fetch.

  const _origXHROpen = XMLHttpRequest.prototype.open;
  const _origXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._lsUrl = url;
    return _origXHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const url = this._lsUrl || '';

    if (url.includes('/youtubei/v1/player') || url.includes('/youtubei/v1/next')) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState !== 4) return;

        try {
          const json = JSON.parse(this.responseText);
          stripAds(json);
          const cleaned = JSON.stringify(json);

          // Override responseText with cleaned version
          Object.defineProperty(this, 'responseText', { value: cleaned, writable: false });
          Object.defineProperty(this, 'response', { value: cleaned, writable: false });
        } catch (_) {
          // Parse failed — leave response untouched
        }
      });
    }

    return _origXHRSend.apply(this, args);
  };

  // ---- Anti-detection: remove adblock warning overlays ----
  // YouTube may inject a modal overlay warning about ad blockers.
  // We watch for it and remove it immediately, then resume video.

  function nukeAdblockWarning() {
    // The enforcement overlay
    const enforcementEl = document.querySelector(
      'ytd-enforcement-message-view-model, tp-yt-paper-dialog:has(.yt-ad-blocking-renderer)'
    );
    if (enforcementEl) {
      enforcementEl.remove();
    }

    // The popup dialog about ad blockers
    const dialogs = document.querySelectorAll('tp-yt-paper-dialog');
    for (const dialog of dialogs) {
      const text = dialog.textContent || '';
      for (const needle of ADBLOCK_DETECT_STRINGS) {
        if (text.toLowerCase().includes(needle.toLowerCase())) {
          dialog.remove();
          break;
        }
      }
    }

    // Restore video playback if paused by detection
    const video = document.querySelector('video.html5-main-video');
    if (video && video.paused) {
      video.play().catch(() => {});
    }

    // Remove backdrop overlay
    const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
    if (backdrop) {
      backdrop.style.display = 'none';
    }

    // Restore body scrolling
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // Run anti-detection on a mutation observer — catches dynamically injected warnings
  const observer = new MutationObserver(nukeAdblockWarning);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Also run periodically for the first 30 seconds as a safety net
  let checkCount = 0;
  const earlyCheck = setInterval(() => {
    nukeAdblockWarning();
    checkCount++;
    if (checkCount >= 30) clearInterval(earlyCheck);
  }, 1000);

})();
