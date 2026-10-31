/**
 * EqualEd Accessibility Extension — Background Service Worker
 * Manages global state, context menus, keyboard shortcuts, and tab coordination.
 */

// ─── Default Settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  // Visual
  fontSize: 100,          // percentage
  lineHeight: 1.5,
  letterSpacing: 0,       // em units
  wordSpacing: 0,
  fontFamily: 'default',  // 'default' | 'dyslexic' | 'sans' | 'serif' | 'mono'
  highContrast: false,
  contrastTheme: 'dark',  // 'dark' | 'yellow-black' | 'green-black' | 'white-black'
  darkMode: false,
  colorFilter: 'none',    // 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'grayscale'
  saturation: 100,
  brightness: 100,

  // Reading aids
  readingGuide: false,
  readingMask: false,
  focusMode: false,
  highlightLinks: false,
  highlightHeadings: false,
  showAltText: false,
  textAlign: 'default',   // 'default' | 'left' | 'center' | 'justify'
  paragraphSpacing: 0,

  // Animations
  pauseAnimations: false,

  // Text-to-Speech
  ttsEnabled: false,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 1.0,
  ttsVoice: '',
  ttsReadOnClick: false,
  ttsAutoRead: false,
  ttsHighlight: true,

  // Voice Control
  voiceEnabled: false,

  // Panel
  panelVisible: false,
  panelPosition: 'right', // 'right' | 'left'

  // Profile
  activeProfile: 'none',  // 'none' | 'visual' | 'motor' | 'adhd'
};

// ─── Accessibility Profiles ────────────────────────────────────────────────────
const PROFILES = {
  visual: {
    highContrast: true,
    contrastTheme: 'yellow-black',
    fontSize: 130,
    highlightLinks: true,
    showAltText: true,
  },
  motor: {
    voiceEnabled: true,
  },
  adhd: {
    readingGuide: true,
    readingMask: true,
    pauseAnimations: true,
    highlightLinks: false,
    fontSize: 110,
  },
};

// ─── Installation / Startup ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  // Initialize default settings
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...stored });

  // Create context menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'equaled-read-selection',
      title: '🔊 EqualEd: Read Selected Text',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'equaled-define-selection',
      title: '📖 EqualEd: Define Selected Word',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'equaled-separator',
      type: 'separator',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'equaled-toggle-panel',
      title: '♿ EqualEd: Toggle Accessibility Panel',
      contexts: ['page'],
    });
    chrome.contextMenus.create({
      id: 'equaled-toggle-contrast',
      title: '🎨 EqualEd: Toggle High Contrast',
      contexts: ['page'],
    });
  });

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/welcome.html') });
  }
});

// ─── Context Menu Handlers ─────────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'equaled-read-selection':
      chrome.tabs.sendMessage(tab.id, {
        type: 'TTS_READ',
        text: info.selectionText,
      }).catch(() => {});
      break;

    case 'equaled-define-selection':
      chrome.tabs.sendMessage(tab.id, {
        type: 'DEFINE_WORD',
        word: info.selectionText?.trim(),
      }).catch(() => {});
      break;

    case 'equaled-toggle-panel':
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }).catch(() => {});
      break;

    case 'equaled-toggle-contrast': {
      const { highContrast } = await chrome.storage.sync.get('highContrast');
      const newVal = !highContrast;
      await chrome.storage.sync.set({ highContrast: newVal });
      chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_SETTING',
        key: 'highContrast',
        value: newVal,
      }).catch(() => {});
      break;
    }
  }
});

// ─── Keyboard Shortcut Handlers ────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'toggle-panel':
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' }).catch(() => {});
      break;
    case 'toggle-tts': {
      const { ttsEnabled } = await chrome.storage.sync.get('ttsEnabled');
      const newVal = !ttsEnabled;
      await chrome.storage.sync.set({ ttsEnabled: newVal });
      chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_SETTING',
        key: 'ttsEnabled',
        value: newVal,
      }).catch(() => {});
      break;
    }
    case 'toggle-high-contrast': {
      const { highContrast } = await chrome.storage.sync.get('highContrast');
      const newVal = !highContrast;
      await chrome.storage.sync.set({ highContrast: newVal });
      chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_SETTING',
        key: 'highContrast',
        value: newVal,
      }).catch(() => {});
      break;
    }
  }
});

// ─── Message Routing ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    // Popup → background: apply settings to active tab
    case 'APPLY_ALL_SETTINGS': {
      (async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && tab.url?.startsWith('http')) {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'APPLY_ALL_SETTINGS',
              settings: message.settings,
            }).catch(() => {});
          }
        } catch (_) {}
        sendResponse({ ok: true });
      })();
      return true;
    }

    // Apply accessibility profile
    case 'APPLY_PROFILE': {
      (async () => {
        const profileName = message.profile;
        const profileSettings = PROFILES[profileName] || {};

        // For the motor profile: only layer voice control on top of current
        // settings so nothing else is altered. All other profiles (and
        // clearing a profile) reset settings to defaults first.
        let merged;
        if (profileName === 'motor') {
          const current = await chrome.storage.sync.get(null);
          merged = { ...DEFAULT_SETTINGS, ...current, ...profileSettings, activeProfile: profileName };
        } else {
          merged = { ...DEFAULT_SETTINGS, ...profileSettings, activeProfile: profileName };
        }

        await chrome.storage.sync.set(merged);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'APPLY_ALL_SETTINGS',
            settings: merged,
          }).catch(() => {});
        }
        sendResponse({ ok: true, settings: merged });
      })();
      return true;
    }

    // Reset all settings
    case 'RESET_ALL': {
      (async () => {
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'APPLY_ALL_SETTINGS',
            settings: DEFAULT_SETTINGS,
          }).catch(() => {});
        }
        sendResponse({ ok: true, settings: DEFAULT_SETTINGS });
      })();
      return true;
    }

    // Get Chrome TTS voices
    case 'GET_TTS_VOICES': {
      chrome.tts.getVoices((voices) => {
        sendResponse({ voices: voices || [] });
      });
      return true;
    }

    // Speak via Chrome TTS API
    case 'TTS_SPEAK': {
      chrome.tts.stop();
      chrome.tts.speak(message.text, {
        rate: message.rate || 1.0,
        pitch: message.pitch || 1.0,
        volume: message.volume || 1.0,
        voiceName: message.voiceName || '',
        onEvent: (event) => {
          if (sender.tab?.id && event.type === 'word') {
            chrome.tabs.sendMessage(sender.tab.id, {
              type: 'TTS_WORD_EVENT',
              charIndex: event.charIndex,
              charLength: event.charLength,
            }).catch(() => {});
          }
        },
      });
      sendResponse({ ok: true });
      return true;
    }

    case 'TTS_STOP': {
      chrome.tts.stop();
      sendResponse({ ok: true });
      return true;
    }

    // Notifications
    case 'SHOW_NOTIFICATION': {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'EqualEd Accessibility',
        message: message.text,
      });
      sendResponse({ ok: true });
      return true;
    }
  }
});

// ─── Tab Navigation: re-apply settings on tab update ─────────────────────────
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url?.startsWith('http')) return;

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  // Only re-inject if at least one feature is on
  const hasActiveFeature = Object.entries(settings).some(([k, v]) => {
    if (k === 'fontSize' && v !== 100) return true;
    if (typeof v === 'boolean' && v === true) return true;
    return false;
  });

  if (hasActiveFeature) {
    // Small delay to let content script inject first
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        type: 'APPLY_ALL_SETTINGS',
        settings,
      }).catch(() => {}); // Tab may not support content scripts
    }, 500);
  }
});

console.log('[EqualEd] Background service worker started.');
