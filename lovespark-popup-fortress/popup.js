'use strict';

// ============================================================
// LoveSpark Popup Fortress — Popup Controller
// ============================================================

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

// ---- Messages ----

const MESSAGES = [
  'No popups allowed, bestie! 💕',
  'Fortress holding strong! ✨',
  'Your walls are unbreakable! 🏰',
  'Browse in peace! 🌸',
  'Popups? Never heard of them! 💖',
];

const $ = (sel) => document.querySelector(sel);

const todayEl = $('#todayCount');
const totalEl = $('#totalCount');
const toggleEl = $('#enableToggle');
const statusDot = $('#statusDot');
const statusText = $('#statusText');
const footerMsg = $('#footerMsg');

footerMsg.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

function loadStats() {
  try {
    chrome.storage.local.get(
      ['popupsBlockedToday', 'popupsBlockedTotal', 'isEnabled'],
      (data) => {
        animateValue(todayEl, data.popupsBlockedToday || 0);
        animateValue(totalEl, data.popupsBlockedTotal || 0);
        updateToggleUI(data.isEnabled !== false);
      }
    );
  } catch (_) {}
}

function animateValue(el, target) {
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) return;

  el.textContent = target;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}

function updateToggleUI(enabled) {
  if (enabled) {
    toggleEl.classList.add('active');
    statusDot.classList.remove('disabled');
    statusText.textContent = 'Fortress Active';
  } else {
    toggleEl.classList.remove('active');
    statusDot.classList.add('disabled');
    statusText.textContent = 'Fortress Down';
  }
}

toggleEl.addEventListener('click', () => {
  const newState = !toggleEl.classList.contains('active');
  try { chrome.storage.local.set({ isEnabled: newState }); } catch (_) {}
  updateToggleUI(newState);
});

try {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.popupsBlockedToday) {
      animateValue(todayEl, changes.popupsBlockedToday.newValue || 0);
    }
    if (changes.popupsBlockedTotal) {
      animateValue(totalEl, changes.popupsBlockedTotal.newValue || 0);
    }
  });
} catch (_) {}

loadStats();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
