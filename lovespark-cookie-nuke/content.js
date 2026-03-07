'use strict';

// ============================================================
// LoveSpark Cookie Annihilator — Content Script (ISOLATED)
// Fallback layer: MutationObserver catches dynamically injected
// banners, auto-clicks "reject all" buttons, fixes scroll-lock.
// ============================================================

(function() {

  let isEnabled = true;
  let nukesOnThisPage = 0;

  // Load state
  try {
    chrome.storage.local.get(['isEnabled'], (result) => {
      if (result.isEnabled === false) isEnabled = false;
    });
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.isEnabled) isEnabled = changes.isEnabled.newValue;
    });
  } catch (_) {}

  // ---- Selectors ----

  // All known banner container selectors
  const BANNER_SELECTORS = [
    '#onetrust-banner-sdk', '#onetrust-consent-sdk',
    '#CybotCookiebotDialog',
    '.cc-window', '.cc-banner', '.cc_banner', '#cc_div',
    '.qc-cmp2-container', '#qc-cmp2-ui',
    '#usercentrics-root', '#uc-center-container',
    '#didomi-host', '#didomi-popup',
    '#iubenda-cs-banner',
    '#termly-code-snippet-support', '.termly-consent-banner',
    '#cmplz-cookiebanner-container',
    '.osano-cm-window', '.osano-cm-dialog',
    '#lanyard-root',
    '.sp-message-container', 'div[id^="sp_message_container"]',
    '#truste-consent-track', '#consent_blackbar',
    '#cookie-script-banner',
    '.cookiefirst-root', '#cookiefirst-root',
    '#cookie-law-info-bar', '.cky-consent-container', '#cky-consent',
    '#axeptio_overlay',
    '#BorlabsCookieBox',
    '#moove_gdpr_cookie_info_bar',
    '#_evidon_banner',
    '#ccc-notify', '#ccc',
    '#coiOverlay', '#coiConsentBanner',
  ];

  // Reject/decline button text patterns (case-insensitive matching)
  const REJECT_PATTERNS = [
    'reject all', 'reject', 'decline all', 'decline',
    'deny all', 'deny', 'refuse all', 'refuse',
    'necessary only', 'essential only', 'essentials only',
    'only necessary', 'only essential',
    'manage preferences', 'manage cookies', 'cookie settings',
    'customize', 'ablehnen', 'tout refuser', 'refuser',
    'rifiuta', 'rechazar', 'rejeitar',
  ];

  // Settings/save button patterns (used after opening settings)
  const SAVE_PATTERNS = [
    'save', 'confirm', 'save preferences', 'save settings',
    'confirm choices', 'accept selected', 'save my choices',
    'speichern', 'enregistrer', 'salva', 'guardar',
  ];

  // ---- Core logic ----

  /**
   * Try to find and click a "reject all" or "necessary only" button.
   * If not found, try to open settings and uncheck all optional cookies.
   * Last resort: just hide the banner.
   */
  function nukeBanner(bannerEl) {
    if (!isEnabled || !bannerEl) return;

    // Attempt 1: find a reject/decline button
    const buttons = bannerEl.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], input[type="submit"]');

    for (const btn of buttons) {
      const text = (btn.textContent || btn.value || '').trim().toLowerCase();

      for (const pattern of REJECT_PATTERNS) {
        if (text.includes(pattern)) {
          btn.click();
          reportNuked();
          cleanupAfterNuke(bannerEl);
          return;
        }
      }
    }

    // Attempt 2: look for a "settings" / "manage" button, click it,
    // then try to find save/confirm with defaults (usually necessary only)
    for (const btn of buttons) {
      const text = (btn.textContent || btn.value || '').trim().toLowerCase();
      if (text.includes('manage') || text.includes('settings') || text.includes('customize') || text.includes('preferences')) {
        btn.click();

        // Wait for settings panel to appear, then try to save with minimal selection
        setTimeout(() => {
          tryUncheckAndSave(bannerEl);
        }, 500);
        return;
      }
    }

    // Attempt 3: just hide it
    bannerEl.style.display = 'none';
    reportNuked();
    cleanupAfterNuke(bannerEl);
  }

  /**
   * In the settings panel: uncheck all optional cookie toggles, then save.
   */
  function tryUncheckAndSave(bannerEl) {
    // Uncheck any checked toggles/checkboxes that aren't "necessary"
    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"]:checked, [role="checkbox"][aria-checked="true"], .toggle-switch.active'
    );

    for (const cb of checkboxes) {
      const label = cb.closest('label, [class*="category"], [class*="purpose"], tr, li');
      const text = (label?.textContent || '').toLowerCase();

      // Don't uncheck "necessary" or "essential" — those should stay on
      if (text.includes('necessary') || text.includes('essential') || text.includes('required') || text.includes('strictly')) {
        continue;
      }

      cb.click();
    }

    // Find and click save/confirm button
    setTimeout(() => {
      const allBtns = document.querySelectorAll('button, a[role="button"], [role="button"]');
      for (const btn of allBtns) {
        const text = (btn.textContent || '').trim().toLowerCase();
        for (const pattern of SAVE_PATTERNS) {
          if (text.includes(pattern)) {
            btn.click();
            reportNuked();
            cleanupAfterNuke(bannerEl);
            return;
          }
        }
      }

      // If we couldn't find a save button, just hide everything
      bannerEl.style.display = 'none';
      reportNuked();
      cleanupAfterNuke(bannerEl);
    }, 300);
  }

  /**
   * Post-nuke cleanup: remove dark overlays, restore scrolling.
   */
  function cleanupAfterNuke(bannerEl) {
    // Remove common backdrop overlays
    const overlays = document.querySelectorAll(
      '.onetrust-pc-dark-filter, .cc-overlay, .didomi-popup-backdrop, ' +
      '.qc-cmp2-main, [class*="consent-overlay"], [class*="cookie-overlay"]'
    );
    for (const el of overlays) {
      el.style.display = 'none';
    }

    // Restore body scroll
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove(
      'modal-open', 'cookie-modal-open', 'cmplz-blocked',
      'sp-message-open', 'didomi-popup-open'
    );
  }

  /**
   * Report a nuked banner to the background worker for counting.
   */
  function reportNuked() {
    nukesOnThisPage++;
    try {
      chrome.runtime.sendMessage({ action: 'bannerNuked' });
    } catch (_) {}
  }

  // ---- MutationObserver: catch dynamically injected banners ----

  function scanForBanners(root) {
    if (!isEnabled) return;

    for (const selector of BANNER_SELECTORS) {
      const els = (root || document).querySelectorAll(selector);
      for (const el of els) {
        // Only nuke if visible and not already hidden
        if (el.offsetParent !== null || getComputedStyle(el).display !== 'none') {
          nukeBanner(el);
        }
      }
    }

    // Also check generic attribute patterns
    const generics = (root || document).querySelectorAll(
      '[id*="cookie-consent"], [id*="cookie-banner"], [class*="cookie-consent"], ' +
      '[class*="cookie-banner"], [id*="gdpr-banner"], [class*="gdpr-banner"]'
    );
    for (const el of generics) {
      if (el.offsetParent !== null || getComputedStyle(el).display !== 'none') {
        nukeBanner(el);
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Check if the added node itself is a banner
        if (node.matches) {
          for (const sel of BANNER_SELECTORS) {
            try {
              if (node.matches(sel)) {
                nukeBanner(node);
                break;
              }
            } catch (_) {}
          }
        }

        // Check children of the added node
        if (node.querySelectorAll) {
          scanForBanners(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // ---- Initial scan ----
  // Run once at document_idle to catch any banners already in the DOM

  scanForBanners();

  // Second pass after a short delay — some CMPs inject after DOMContentLoaded
  setTimeout(scanForBanners, 1500);
  setTimeout(scanForBanners, 4000);

})();
