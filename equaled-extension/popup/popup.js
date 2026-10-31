/**
 * EqualEd Accessibility Extension — Popup Controller (Production)
 * Fix: Sends settings DIRECTLY to active tab, not via background.
 */

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Toast notification ───────────────────────────────────────────────────────
function showToast(msg, duration = 1800) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Send setting directly to the active tab's content script ─────────────────
async function sendToTab(settings) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url?.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'APPLY_ALL_SETTINGS',
        settings,
      }).catch(() => {}); // tab may not have content script yet
    }
  } catch (_) {}
}

// ─── Save a single setting ────────────────────────────────────────────────────
async function saveSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  // storage.onChanged in content.js will auto-apply — sendToTab is belt+suspenders
  const all = await chrome.storage.sync.get(SETTING_KEYS);
  await sendToTab(all);
}

// ─── All setting keys (must match content.js) ─────────────────────────────────
const SETTING_KEYS = [
  'fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing', 'paragraphSpacing',
  'fontFamily', 'highContrast', 'contrastTheme', 'darkMode', 'colorFilter',
  'saturation', 'brightness', 'readingGuide', 'readingMask', 'focusMode',
  'highlightLinks', 'highlightHeadings', 'showAltText', 'textAlign',
  'pauseAnimations', 'ttsEnabled', 'ttsRate', 'ttsPitch', 'ttsVolume', 'ttsVoice',
  'ttsReadOnClick', 'ttsAutoRead', 'ttsHighlight', 'voiceEnabled',
  'activeProfile',
];

// ─── Load voices for TTS ──────────────────────────────────────────────────────
async function loadVoices() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TTS_VOICES' }, (resp) => {
      const select = $('ttsVoice');
      if (!select || !resp?.voices) { resolve(); return; }
      select.innerHTML = '<option value="">System Default</option>';
      resp.voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceName;
        opt.textContent = `${v.voiceName} (${v.lang})`;
        select.appendChild(opt);
      });
      resolve();
    });
  });
}

// ─── Pill group binding ───────────────────────────────────────────────────────
function bindPillGroup(groupId, storageKey) {
  const group = $(groupId);
  if (!group) return;
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', async () => {
      group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      await saveSetting(storageKey, pill.dataset.value);
    });
  });
}

function setPillGroupValue(groupId, value) {
  const group = $(groupId);
  if (!group) return;
  group.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.value === String(value));
  });
}

// ─── Helper: update label ─────────────────────────────────────────────────────
function updateLabel(el, text) {
  if (el) el.textContent = text;
}

// ─── Main init ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  const settings = await chrome.storage.sync.get(SETTING_KEYS);

  // ── Tab Navigation ──────────────────────────────────────────────────────────
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $(`tab-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // ── Profile Buttons ─────────────────────────────────────────────────────────
  $$('.profile-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wasActive = btn.classList.contains('active');
      const clickedProfile = btn.dataset.profile;
      const profileName = (wasActive && clickedProfile !== 'none') ? 'none' : clickedProfile;

      $$('.profile-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.profile === profileName);
      });

      chrome.runtime.sendMessage({ type: 'APPLY_PROFILE', profile: profileName }, async (resp) => {
        if (resp?.settings) {
          loadSettingsIntoUI(resp.settings);
          await sendToTab(resp.settings);
          showToast(`✅ ${profileName === 'none' ? 'Profile cleared' : `"${profileName}" profile applied`}`);
        }
      });
    });

    if (btn.dataset.profile === (settings.activeProfile || 'none')) {
      btn.classList.add('active');
    }
  });

  // ── Smart Toggle Buttons (Voice / TTS / Focus quick cards) ────────────────
  $$('.smart-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const toggleId = btn.dataset.toggle;
      const el = $(toggleId);
      if (el && el.type === 'checkbox') {
        el.checked = !el.checked;
        el.dispatchEvent(new Event('change'));
        btn.classList.toggle('active', el.checked);
      }
    });
  });

  // ── Reset Button ────────────────────────────────────────────────────────────
  $('resetBtn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'RESET_ALL' }, async (resp) => {
      if (resp?.settings) {
        loadSettingsIntoUI(resp.settings);
        await sendToTab(resp.settings);
        showToast('🔄 All settings reset');
      }
    });
  });

  // ── VISUAL TAB: Font Size ───────────────────────────────────────────────────
  const fontSizeSlider = $('fontSize');
  const fontSizeVal = $('fontSizeVal');
  if (fontSizeSlider) {
    fontSizeSlider.value = settings.fontSize ?? 100;
    updateLabel(fontSizeVal, `${settings.fontSize ?? 100}%`);

    fontSizeSlider.addEventListener('input', async (e) => {
      const v = Number(e.target.value);
      updateLabel(fontSizeVal, `${v}%`);
      await saveSetting('fontSize', v);
    });

    $('fontDecrease')?.addEventListener('click', async () => {
      const v = Math.max(80, Number(fontSizeSlider.value) - 5);
      fontSizeSlider.value = v;
      updateLabel(fontSizeVal, `${v}%`);
      await saveSetting('fontSize', v);
    });

    $('fontIncrease')?.addEventListener('click', async () => {
      const v = Math.min(200, Number(fontSizeSlider.value) + 5);
      fontSizeSlider.value = v;
      updateLabel(fontSizeVal, `${v}%`);
      await saveSetting('fontSize', v);
    });
  }

  // Font Family
  bindPillGroup('fontFamilyGroup', 'fontFamily');
  setPillGroupValue('fontFamilyGroup', settings.fontFamily || 'default');

  // High Contrast
  bindToggleFn('highContrast', (val) => {
    const themeRow = $('contrastThemeRow');
    if (themeRow) themeRow.style.display = val ? 'block' : 'none';
  });
  const themeRow = $('contrastThemeRow');
  if (themeRow) themeRow.style.display = settings.highContrast ? 'block' : 'none';

  bindPillGroup('contrastThemeGroup', 'contrastTheme');
  setPillGroupValue('contrastThemeGroup', settings.contrastTheme || 'dark');

  bindToggleFn('darkMode');
  bindPillGroup('colorFilterGroup', 'colorFilter');
  setPillGroupValue('colorFilterGroup', settings.colorFilter || 'none');
  bindRangeInput('saturation', 'saturationVal', '%');
  bindToggleFn('highlightLinks');
  bindToggleFn('showAltText');

  // ── READING TAB ─────────────────────────────────────────────────────────────
  bindRangeInput('lineHeight', 'lineHeightVal', '');
  bindRangeInput('letterSpacing', 'letterSpacingVal', 'em');
  bindRangeInput('wordSpacing', 'wordSpacingVal', 'em');
  bindRangeInput('paragraphSpacing', 'paragraphSpacingVal', 'px');
  bindPillGroup('textAlignGroup', 'textAlign');
  setPillGroupValue('textAlignGroup', settings.textAlign || 'default');
  bindToggleFn('readingGuide');
  bindToggleFn('readingMask');
  bindToggleFn('focusMode');
  bindToggleFn('highlightHeadings');
  bindToggleFn('pauseAnimations');

  // ── SPEECH TAB ──────────────────────────────────────────────────────────────
  await loadVoices();

  bindToggleFn('ttsEnabled', (val) => {
    const opts = $('ttsOptions');
    if (opts) { opts.style.opacity = val ? '1' : '0.5'; opts.style.pointerEvents = val ? 'auto' : 'none'; }
  });
  if ($('ttsOptions')) {
    $('ttsOptions').style.opacity = settings.ttsEnabled ? '1' : '0.5';
    $('ttsOptions').style.pointerEvents = settings.ttsEnabled ? 'auto' : 'none';
  }

  bindRangeInput('ttsRate', 'ttsRateVal', 'x', (v) => v.toFixed(1));
  bindRangeInput('ttsPitch', 'ttsPitchVal', '', (v) => v.toFixed(1));
  bindRangeInput('ttsVolume', 'ttsVolumeVal', '%', (v) => Math.round(v * 100));

  $('ttsVoice')?.addEventListener('change', async (e) => {
    await saveSetting('ttsVoice', e.target.value);
  });
  if ($('ttsVoice') && settings.ttsVoice) {
    $('ttsVoice').value = settings.ttsVoice;
  }

  bindToggleFn('ttsReadOnClick');
  bindToggleFn('ttsAutoRead');
  bindToggleFn('ttsHighlight');

  $('ttsPlay')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TTS_READ_PAGE' }).catch(() => {});
      showToast('▶ Reading page...');
    }
  });

  $('ttsPause')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'TTS_PAUSE' }).catch(() => {});
  });

  $('ttsStop')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'TTS_STOP' }).catch(() => {});
    showToast('⏹ TTS stopped');
  });

  // Voice Control
  bindToggleFn('voiceEnabled', (val) => {
    const cmds = $('voiceCommands');
    if (cmds) cmds.style.display = val ? 'block' : 'none';
    showToast(val ? '🎙️ Voice control on' : '🎙️ Voice control off');
  });
  const cmdsEl = $('voiceCommands');
  if (cmdsEl) cmdsEl.style.display = settings.voiceEnabled ? 'block' : 'none';

  // ── MOTION TAB ──────────────────────────────────────────────────────────────
  bindToggleFn('eyeTracking', (val) => {
    const info = $('eyeTrackingInfo');
    if (info) info.style.display = val ? 'flex' : 'none';
    showToast(val ? '👁️ Eye tracking on' : '👁️ Eye tracking off');
  });
  const eyeInfo = $('eyeTrackingInfo');
  if (eyeInfo) eyeInfo.style.display = settings.eyeTracking ? 'flex' : 'none';

  bindToggleFn('handTracking', (val) => {
    const info = $('handTrackingInfo');
    if (info) info.style.display = val ? 'flex' : 'none';
    showToast(val ? '✋ Hand control on' : '✋ Hand control off');
  });
  const handInfo = $('handTrackingInfo');
  if (handInfo) handInfo.style.display = settings.handTracking ? 'flex' : 'none';

  // ── Load all values into UI ─────────────────────────────────────────────────
  loadSettingsIntoUI(settings);
});

// ─── Load settings into UI ────────────────────────────────────────────────────
function loadSettingsIntoUI(s) {
  ['highContrast', 'darkMode', 'highlightLinks', 'showAltText',
   'readingGuide', 'readingMask', 'focusMode', 'highlightHeadings', 'pauseAnimations',
   'ttsEnabled', 'ttsReadOnClick', 'ttsAutoRead', 'ttsHighlight',
   'voiceEnabled', 'eyeTracking', 'handTracking'].forEach(key => {
    const el = $(key);
    if (el && el.type === 'checkbox') el.checked = !!s[key];
  });

  if ($('fontSize')) { $('fontSize').value = s.fontSize ?? 100; updateLabel($('fontSizeVal'), `${s.fontSize ?? 100}%`); }
  if ($('saturation')) { $('saturation').value = s.saturation ?? 100; updateLabel($('saturationVal'), `${s.saturation ?? 100}%`); }
  if ($('lineHeight')) { $('lineHeight').value = s.lineHeight ?? 1.5; updateLabel($('lineHeightVal'), s.lineHeight ?? 1.5); }
  if ($('letterSpacing')) { $('letterSpacing').value = s.letterSpacing ?? 0; updateLabel($('letterSpacingVal'), `${s.letterSpacing ?? 0}em`); }
  if ($('wordSpacing')) { $('wordSpacing').value = s.wordSpacing ?? 0; updateLabel($('wordSpacingVal'), `${s.wordSpacing ?? 0}em`); }
  if ($('paragraphSpacing')) { $('paragraphSpacing').value = s.paragraphSpacing ?? 0; updateLabel($('paragraphSpacingVal'), `${s.paragraphSpacing ?? 0}px`); }
  if ($('ttsRate')) { $('ttsRate').value = s.ttsRate ?? 1; updateLabel($('ttsRateVal'), `${(s.ttsRate ?? 1).toFixed(1)}x`); }
  if ($('ttsPitch')) { $('ttsPitch').value = s.ttsPitch ?? 1; updateLabel($('ttsPitchVal'), (s.ttsPitch ?? 1).toFixed(1)); }
  if ($('ttsVolume')) { $('ttsVolume').value = s.ttsVolume ?? 1; updateLabel($('ttsVolumeVal'), `${Math.round((s.ttsVolume ?? 1) * 100)}%`); }

  setPillGroupValue('fontFamilyGroup', s.fontFamily || 'default');
  setPillGroupValue('contrastThemeGroup', s.contrastTheme || 'dark');
  setPillGroupValue('colorFilterGroup', s.colorFilter || 'none');
  setPillGroupValue('textAlignGroup', s.textAlign || 'default');

  const themeRow = $('contrastThemeRow');
  if (themeRow) themeRow.style.display = s.highContrast ? 'block' : 'none';

  // Sync Smart Toggle cards
  $$('.smart-toggle-btn').forEach(btn => {
    const key = btn.dataset.toggle;
    btn.classList.toggle('active', !!s[key]);
  });

  // Sync profile buttons
  $$('.profile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === (s.activeProfile || 'none'));
  });
}

// ─── Helper: bind a checkbox toggle ──────────────────────────────────────────
function bindToggleFn(id, callback) {
  const el = $(id);
  if (!el || el.type !== 'checkbox') return;

  el.addEventListener('change', async () => {
    const val = el.checked;
    await saveSetting(id, val);

    // Sync Smart UI button if it exists
    const smartBtn = document.querySelector(`.smart-btn[data-toggle="${id}"]`);
    if (smartBtn) smartBtn.classList.toggle('active', val);

    callback?.(val);
  });
}

// ─── Helper: bind a range slider ─────────────────────────────────────────────
function bindRangeInput(id, labelId, unit, formatter) {
  const slider = $(id);
  const label = $(labelId);
  if (!slider) return;

  // Set initial value from storage
  chrome.storage.sync.get(id, (result) => {
    if (result[id] !== undefined) {
      slider.value = result[id];
      const fmt = formatter || ((v) => parseFloat(v).toFixed(unit === 'em' ? 2 : 0));
      updateLabel(label, `${fmt(result[id])}${unit}`);
    }
  });

  const fmt = formatter || ((v) => parseFloat(v).toFixed(unit === 'em' ? 2 : 0));
  slider.addEventListener('input', async (e) => {
    const v = parseFloat(e.target.value);
    updateLabel(label, `${fmt(v)}${unit}`);
    await saveSetting(id, v);
  });
}
