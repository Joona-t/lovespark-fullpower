'use strict';

// ============================================================
// LoveSpark YouTube Shield — Popup Controller
// Reads stats from storage, handles enable/disable toggle.
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
  'Ad-free vibes only 💕',
  'No ads here, bestie! ✨',
  'Shielded with love! 💖',
  'Browse in peace! 🌸',
  'Your time is sacred! ✨',
];

const $ = (sel) => document.querySelector(sel);

const todayEl = $('#todayCount');
const totalEl = $('#totalCount');
const toggleEl = $('#enableToggle');
const statusDot = $('#statusDot');
const statusText = $('#statusText');
const footerMsg = $('#footerMsg');

// Random motivational message
footerMsg.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

// ---- Load stats ----

function loadStats() {
  try {
    chrome.storage.local.get(
      ['adsNeutralizedToday', 'adsNeutralizedTotal', 'isEnabled'],
      (data) => {
        animateValue(todayEl, data.adsNeutralizedToday || 0);
        animateValue(totalEl, data.adsNeutralizedTotal || 0);

        const enabled = data.isEnabled !== false;
        updateToggleUI(enabled);
      }
    );
  } catch (_) {}
}

// ---- Counter animation ----

function animateValue(el, target) {
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) return;

  el.textContent = target;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}

// ---- Toggle ----

function updateToggleUI(enabled) {
  if (enabled) {
    toggleEl.classList.add('active');
    statusDot.classList.remove('disabled');
    statusText.textContent = 'Shield Active';
  } else {
    toggleEl.classList.remove('active');
    statusDot.classList.add('disabled');
    statusText.textContent = 'Shield Paused';
  }

  // Update layer indicators
  document.querySelectorAll('.layer-indicator').forEach((dot) => {
    if (enabled) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

toggleEl.addEventListener('click', () => {
  const isActive = toggleEl.classList.contains('active');
  const newState = !isActive;

  try {
    chrome.storage.local.set({ isEnabled: newState });
  } catch (_) {}

  updateToggleUI(newState);
});

// ---- Live counter updates ----

try {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.adsNeutralizedToday) {
      animateValue(todayEl, changes.adsNeutralizedToday.newValue || 0);
    }
    if (changes.adsNeutralizedTotal) {
      animateValue(totalEl, changes.adsNeutralizedTotal.newValue || 0);
    }
  });
} catch (_) {}

// ---- Init ----

loadStats();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
