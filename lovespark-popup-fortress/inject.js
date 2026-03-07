'use strict';

// ============================================================
// LoveSpark Popup Fortress — MAIN World Injector
// Overrides window.open, location.assign, location.replace,
// synthetic anchor clicks, and meta refresh injections.
// Only allows navigation during verified user gestures.
// ============================================================

(function() {

  // ---- User gesture tracking ----
  // A "real" gesture = click/keydown/touchend within the last 1500ms.
  // Capture phase on document so we see it before anyone else.

  let lastGestureTime = 0;
  const GESTURE_WINDOW = 1500; // ms

  function markGesture() {
    lastGestureTime = Date.now();
  }

  function hasRecentGesture() {
    return (Date.now() - lastGestureTime) < GESTURE_WINDOW;
  }

  document.addEventListener('click', markGesture, true);
  document.addEventListener('keydown', markGesture, true);
  document.addEventListener('touchend', markGesture, true);

  // ---- Counter reporting ----
  // Post a message to the page so our content script (if present) can relay
  // to the background. We're in MAIN world so we can't use chrome.runtime.

  let blocked = 0;

  function reportBlocked() {
    blocked++;
    try {
      window.postMessage({
        type: 'LOVESPARK_POPUP_BLOCKED',
        count: blocked,
      }, '*');
    } catch (_) {}
  }

  // ---- Override window.open ----
  // The primary popup vector. Sites call window.open() without a user gesture.

  const _origOpen = window.open;

  window.open = function(url, target, features) {
    if (hasRecentGesture()) {
      // User actually clicked something — allow it
      return _origOpen.call(this, url, target, features);
    }
    // Programmatic popup — block it
    reportBlocked();
    return null;
  };

  // ---- Override location.assign and location.replace ----
  // Sites use these to redirect you to ad/scam pages without user action.

  const _origAssign = window.location.assign;
  const _origReplace = window.location.replace;

  const locationProxy = {
    assign(url) {
      if (hasRecentGesture()) {
        return _origAssign.call(window.location, url);
      }
      reportBlocked();
    },
    replace(url) {
      if (hasRecentGesture()) {
        return _origReplace.call(window.location, url);
      }
      reportBlocked();
    },
  };

  try {
    Object.defineProperty(window.location, 'assign', {
      value: locationProxy.assign.bind(locationProxy),
      writable: false,
      configurable: false,
    });
  } catch (_) {
    // Some browsers don't allow redefining location properties
    // Fall back to prototype patching
    Location.prototype.assign = function(url) {
      if (hasRecentGesture()) {
        return _origAssign.call(this, url);
      }
      reportBlocked();
    };
  }

  try {
    Object.defineProperty(window.location, 'replace', {
      value: locationProxy.replace.bind(locationProxy),
      writable: false,
      configurable: false,
    });
  } catch (_) {
    Location.prototype.replace = function(url) {
      if (hasRecentGesture()) {
        return _origReplace.call(this, url);
      }
      reportBlocked();
    };
  }

  // ---- Intercept synthetic anchor clicks ----
  // Pattern: create <a href="ad.com" target="_blank">, call a.click()
  // We patch HTMLElement.click to check gesture for anchor elements.

  const _origClick = HTMLElement.prototype.click;

  HTMLElement.prototype.click = function() {
    if (this.tagName === 'A' && this.href && this.target === '_blank') {
      if (!hasRecentGesture()) {
        reportBlocked();
        return;
      }
    }
    return _origClick.call(this);
  };

  // ---- Block meta refresh injections ----
  // Sites inject <meta http-equiv="refresh" content="0;url=ad.com">
  // MutationObserver catches these and removes them.

  const metaObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Direct meta element
        if (node.tagName === 'META' &&
            node.httpEquiv?.toLowerCase() === 'refresh') {
          node.remove();
          reportBlocked();
          continue;
        }

        // Meta nested inside added subtree
        if (node.querySelectorAll) {
          const metas = node.querySelectorAll('meta[http-equiv="refresh"]');
          for (const meta of metas) {
            meta.remove();
            reportBlocked();
          }
        }
      }
    }
  });

  metaObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // ---- Block window.location setter from non-gesture context ----
  // This is tricky because location is special. We use a Proxy approach
  // where we intercept beforeunload if no gesture happened.

  let allowNavigation = false;

  window.addEventListener('beforeunload', (e) => {
    // If we're about to navigate and there's no recent gesture,
    // this might be a programmatic redirect. We can't fully block it
    // from MAIN world, but we set a flag for the content script.
    if (!hasRecentGesture() && !allowNavigation) {
      e.preventDefault();
      reportBlocked();
    }
  });

  // Allow navigation during actual user clicks on links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      allowNavigation = true;
      setTimeout(() => { allowNavigation = false; }, 500);
    }
  }, true);

})();
