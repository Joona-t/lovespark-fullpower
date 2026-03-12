'use strict';

// ============================================================
// LoveSpark YouTube Shield — Background Service Worker
// Handles counter storage, daily reset, badge updates.
// No setInterval — uses chrome.alarms for MV3 safety.
// ============================================================

const DEFAULT_STORAGE = {
  adsNeutralizedToday: 0,
  adsNeutralizedTotal: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  isEnabled: true,
};

// ---- Daily counter reset ----

async function checkDailyReset() {
  try {
    const data = await chrome.storage.local.get(['lastResetDate', 'adsNeutralizedToday']);
    const today = new Date().toISOString().slice(0, 10);

    if (data.lastResetDate !== today) {
      await chrome.storage.local.set({
        adsNeutralizedToday: 0,
        lastResetDate: today,
      });
      updateBadge(0);
    } else {
      updateBadge(data.adsNeutralizedToday || 0);
    }
  } catch (_) {}
}

// ---- Badge ----

function updateBadge(count) {
  try {
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  } catch (_) {}
}

// ---- Message handler ----
// Content script sends { action: 'adNeutralized' } when an ad is skipped.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'adNeutralized') {
    incrementCounter();
    sendResponse({ ok: true });
  }
  if (msg.action === 'getStats') {
    chrome.storage.local.get(
      ['adsNeutralizedToday', 'adsNeutralizedTotal', 'isEnabled'],
      (data) => sendResponse(data)
    );
    return true; // async sendResponse
  }
});

async function incrementCounter() {
  try {
    const data = await chrome.storage.local.get([
      'adsNeutralizedToday',
      'adsNeutralizedTotal',
      'lastResetDate',
    ]);

    const today = new Date().toISOString().slice(0, 10);
    let dailyCount = data.adsNeutralizedToday || 0;
    let totalCount = data.adsNeutralizedTotal || 0;

    // Reset daily if needed
    if (data.lastResetDate !== today) {
      dailyCount = 0;
    }

    dailyCount++;
    totalCount++;

    await chrome.storage.local.set({
      adsNeutralizedToday: dailyCount,
      adsNeutralizedTotal: totalCount,
      lastResetDate: today,
    });

    updateBadge(dailyCount);
  } catch (_) {}
}

// ---- Initialization ----

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(null);
  // Only set defaults for keys that don't exist
  const toSet = {};
  for (const [key, val] of Object.entries(DEFAULT_STORAGE)) {
    if (data[key] === undefined) toSet[key] = val;
  }
  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }
  checkDailyReset();
});

// Guard: only create alarm if it doesn't already exist (MV3 SW restarts)
chrome.alarms.get('dailyReset', (existing) => {
  if (!existing) chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') checkDailyReset();
});

// Check on service worker startup
checkDailyReset();
