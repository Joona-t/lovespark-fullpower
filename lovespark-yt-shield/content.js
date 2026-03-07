'use strict';

// ============================================================
// LoveSpark YouTube Shield — Layer 3: Content Script (ISOLATED)
// Fallback cleanup for any ads that slip past the JSON stripper.
// Watches for .ad-showing class, mutes, clicks skip, counts.
// ============================================================

(function() {

  let isEnabled = true;

  // Load enabled state
  try {
    chrome.storage.local.get(['isEnabled'], (result) => {
      if (result.isEnabled === false) isEnabled = false;
    });
  } catch (_) {}

  // Listen for toggle changes from popup
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.isEnabled) isEnabled = changes.isEnabled.newValue;
    });
  } catch (_) {}

  /**
   * Increment the ad-neutralized counter via the background service worker.
   * Uses chrome.runtime.sendMessage — safe from ISOLATED world.
   */
  function reportNeutralized() {
    try {
      chrome.runtime.sendMessage({ action: 'adNeutralized' });
    } catch (_) {}
  }

  /**
   * Attempt to skip a currently-playing ad.
   * Strategy: mute, then click skip button if available.
   * Does NOT seek video.currentTime — YouTube detects that.
   */
  function handleAdShowing(player) {
    if (!isEnabled) return;

    const video = player.querySelector('video');
    if (video) {
      video.muted = true;
    }

    // Try clicking the skip button
    const skipBtn = player.querySelector(
      '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, button[class*="skip"]'
    );
    if (skipBtn) {
      skipBtn.click();
      reportNeutralized();
      return;
    }

    // If no skip button yet, watch for it to appear
    const skipObserver = new MutationObserver((_, obs) => {
      const btn = player.querySelector(
        '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, button[class*="skip"]'
      );
      if (btn) {
        btn.click();
        reportNeutralized();
        obs.disconnect();
      }
    });

    skipObserver.observe(player, { childList: true, subtree: true });

    // Safety: disconnect after 30 seconds regardless
    setTimeout(() => skipObserver.disconnect(), 30000);
  }

  /**
   * Track when ad-showing class is removed — ad was neutralized.
   * Only count the transition FROM ad-showing to NOT ad-showing.
   */
  let wasAdShowing = false;

  function checkAdState(player) {
    const adNow = player.classList.contains('ad-showing');

    if (adNow && !wasAdShowing) {
      // Ad just started — handle it
      handleAdShowing(player);
    } else if (!adNow && wasAdShowing) {
      // Ad ended — unmute
      const video = player.querySelector('video');
      if (video) video.muted = false;
    }

    wasAdShowing = adNow;
  }

  /**
   * Main initialization — find the player and start watching.
   */
  function init() {
    const player = document.querySelector('.html5-video-player');
    if (!player) return;

    // Check initial state
    checkAdState(player);

    // Watch for class changes on the player element
    const observer = new MutationObserver(() => checkAdState(player));
    observer.observe(player, { attributes: true, attributeFilter: ['class'] });
  }

  // YouTube is an SPA — reinitialize on navigation
  document.addEventListener('yt-navigate-finish', init);
  window.addEventListener('popstate', init);

  // Initial run
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
