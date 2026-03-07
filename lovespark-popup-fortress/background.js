'use strict';

// ============================================================
// LoveSpark Popup Fortress — Background Service Worker
// Handles counter storage, daily reset, badge updates.
// ============================================================

const DEFAULT_STORAGE = {
  popupsBlockedToday: 0,
  popupsBlockedTotal: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  isEnabled: true,
};

// ---- Daily counter reset ----

async function checkDailyReset() {
  try {
    const data = await chrome.storage.local.get(['lastResetDate', 'popupsBlockedToday']);
    const today = new Date().toISOString().slice(0, 10);

    if (data.lastResetDate !== today) {
      await chrome.storage.local.set({
        popupsBlockedToday: 0,
        lastResetDate: today,
      });
      updateBadge(0);
    } else {
      updateBadge(data.popupsBlockedToday || 0);
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'popupBlocked') {
    incrementCounter(msg.count || 1);
    sendResponse({ ok: true });
  }
  if (msg.action === 'getStats') {
    chrome.storage.local.get(
      ['popupsBlockedToday', 'popupsBlockedTotal', 'isEnabled'],
      (data) => sendResponse(data)
    );
    return true;
  }
});

async function incrementCounter(count) {
  try {
    const data = await chrome.storage.local.get([
      'popupsBlockedToday',
      'popupsBlockedTotal',
      'lastResetDate',
    ]);

    const today = new Date().toISOString().slice(0, 10);
    let dailyCount = data.popupsBlockedToday || 0;
    let totalCount = data.popupsBlockedTotal || 0;

    if (data.lastResetDate !== today) {
      dailyCount = 0;
    }

    dailyCount += count;
    totalCount += count;

    await chrome.storage.local.set({
      popupsBlockedToday: dailyCount,
      popupsBlockedTotal: totalCount,
      lastResetDate: today,
    });

    updateBadge(dailyCount);
  } catch (_) {}
}

// ---- Initialization ----

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

chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') checkDailyReset();
});

checkDailyReset();
