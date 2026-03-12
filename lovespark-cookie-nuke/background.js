'use strict';

// ============================================================
// LoveSpark Cookie Annihilator — Background Service Worker
// Handles counter storage, daily reset, badge updates.
// ============================================================

const DEFAULT_STORAGE = {
  bannersNukedToday: 0,
  bannersNukedTotal: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  isEnabled: true,
};

async function checkDailyReset() {
  try {
    const data = await chrome.storage.local.get(['lastResetDate', 'bannersNukedToday']);
    const today = new Date().toISOString().slice(0, 10);

    if (data.lastResetDate !== today) {
      await chrome.storage.local.set({
        bannersNukedToday: 0,
        lastResetDate: today,
      });
      updateBadge(0);
    } else {
      updateBadge(data.bannersNukedToday || 0);
    }
  } catch (_) {}
}

function updateBadge(count) {
  try {
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  } catch (_) {}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'bannerNuked') {
    incrementCounter();
    sendResponse({ ok: true });
  }
  if (msg.action === 'getStats') {
    chrome.storage.local.get(
      ['bannersNukedToday', 'bannersNukedTotal', 'isEnabled'],
      (data) => sendResponse(data)
    );
    return true;
  }
});

async function incrementCounter() {
  try {
    const data = await chrome.storage.local.get([
      'bannersNukedToday',
      'bannersNukedTotal',
      'lastResetDate',
    ]);

    const today = new Date().toISOString().slice(0, 10);
    let dailyCount = data.bannersNukedToday || 0;
    let totalCount = data.bannersNukedTotal || 0;

    if (data.lastResetDate !== today) {
      dailyCount = 0;
    }

    dailyCount++;
    totalCount++;

    await chrome.storage.local.set({
      bannersNukedToday: dailyCount,
      bannersNukedTotal: totalCount,
      lastResetDate: today,
    });

    updateBadge(dailyCount);
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(null);
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

checkDailyReset();
