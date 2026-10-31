/**
 * EqualEd — Content Script (Main Entry)
 * Injected on every page. Applies all accessibility features.
 */

(function () {
  'use strict';
  if (window.__equaledLoaded) return;
  window.__equaledLoaded = true;

  // ─── State ──────────────────────────────────────────────────────────────────
  let settings = {};
  let ttsUtterance = null;
  let ttsActive = false;
  let ttsPaused = false;
  let voiceRecog = null;
  let readingGuideEl = null;
  let readingMaskEl = null;
  let focusOverlayEl = null;
  let styleEl = null;
  let floatingPanelEl = null;

  // ─── Load settings & apply ───────────────────────────────────────────────────
  const SETTING_KEYS = [
    'fontSize', 'lineHeight', 'letterSpacing', 'wordSpacing', 'paragraphSpacing',
    'fontFamily', 'highContrast', 'contrastTheme', 'darkMode', 'colorFilter',
    'saturation', 'brightness', 'readingGuide', 'readingMask', 'focusMode',
    'highlightLinks', 'highlightHeadings', 'showAltText', 'textAlign',
    'pauseAnimations', 'ttsEnabled', 'ttsRate', 'ttsPitch', 'ttsVolume', 'ttsVoice',
    'ttsReadOnClick', 'ttsAutoRead', 'ttsHighlight', 'voiceEnabled',
    'activeProfile'
  ];

  chrome.storage.sync.get(SETTING_KEYS, (s) => {
    settings = s || {};
    applyAll(settings);
  });

  chrome.storage.onChanged.addListener((changes) => {
    Object.entries(changes).forEach(([k, v]) => {
      settings[k] = v.newValue;
    });
    applyAll(settings);
  });

  // ─── Message listener from popup / background ────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.type) {
      case 'APPLY_ALL_SETTINGS':
        settings = { ...settings, ...msg.settings };
        applyAll(settings);
        sendResponse({ ok: true });
        break;
      case 'APPLY_SETTING':
        settings[msg.key] = msg.value;
        applyAll(settings);
        sendResponse({ ok: true });
        break;
      case 'TOGGLE_PANEL':
        toggleFloatingPanel();
        sendResponse({ ok: true });
        break;
      case 'TTS_READ':
        speakText(msg.text);
        sendResponse({ ok: true });
        break;
      case 'TTS_READ_PAGE':
        readPage();
        sendResponse({ ok: true });
        break;
      case 'TTS_PAUSE':
        pauseResumeTTS();
        sendResponse({ ok: true });
        break;
      case 'TTS_STOP':
        stopTTS();
        sendResponse({ ok: true });
        break;
      case 'DEFINE_WORD':
        defineWord(msg.word);
        sendResponse({ ok: true });
        break;
    }
    return true;
  });

  // ══════════════════════════════════════════════════════
  //  APPLY ALL SETTINGS
  // ══════════════════════════════════════════════════════
  function applyAll(s) {
    applyCSS(s);
    applyTTS(s);
    applyVoiceControl(s);
    applyReadingGuide(s);
    applyReadingMask(s);
    applyFocusMode(s);
    applyAltText(s);
    if (floatingPanelEl) updateFloatingPanel(s);
  }

  // ══════════════════════════════════════════════════════
  //  CSS INJECTION (Visual & Typography features)
  // ══════════════════════════════════════════════════════
  const FONTS = {
    dyslexic: "'OpenDyslexic', 'Comic Sans MS', cursive",
    sans: "'Helvetica Neue', Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Courier New', Courier, monospace",
    default: '',
  };

  const COLOR_FILTERS = {
    none: '',
    deuteranopia: 'url(#eq-deuter)',
    protanopia: 'url(#eq-protan)',
    tritanopia: 'url(#eq-tritan)',
    grayscale: 'grayscale(100%)',
  };

  const CONTRAST_THEMES = {
    dark: `
      html { background: #000 !important; color: #fff !important; }
      * { background-color: #000 !important; color: #fff !important; border-color: #fff !important; }
      a { color: #ff0 !important; } input, textarea, select { background: #111 !important; color: #fff !important; }
    `,
    'yellow-black': `
      html { background: #000 !important; color: #ff0 !important; }
      * { background-color: #000 !important; color: #ff0 !important; border-color: #ff0 !important; }
      a { color: #0ff !important; text-decoration: underline !important; }
    `,
    'green-black': `
      html { background: #000 !important; color: #0f0 !important; }
      * { background-color: #000 !important; color: #0f0 !important; }
      a { color: #0ff !important; }
    `,
    'white-black': `
      html { background: #fff !important; color: #000 !important; }
      * { background-color: #fff !important; color: #000 !important; border-color: #000 !important; }
      a { color: #00f !important; text-decoration: underline !important; }
    `,
  };

  function applyCSS(s) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'equaled-styles';
      document.head.appendChild(styleEl);
    }

    injectColorFilterSVG();

    let css = `
      /* EqualEd Base */
      html {
        font-size: ${s.fontSize ?? 100}% !important;
        filter: brightness(${s.brightness ?? 100}%) saturate(${s.saturation ?? 100}%) ${s.colorFilter && s.colorFilter !== 'none' && s.colorFilter !== 'grayscale'
        ? COLOR_FILTERS[s.colorFilter] || ''
        : s.colorFilter === 'grayscale' ? 'grayscale(100%)' : ''
      };
      }
      body *, p, li, span, div, td, th, label {
        ${s.lineHeight && s.lineHeight !== 1.5 ? `line-height: ${s.lineHeight} !important;` : ''}
        ${s.letterSpacing ? `letter-spacing: ${s.letterSpacing}em !important;` : ''}
        ${s.wordSpacing ? `word-spacing: ${s.wordSpacing}em !important;` : ''}
        ${s.textAlign && s.textAlign !== 'default' ? `text-align: ${s.textAlign} !important;` : ''}
        ${s.fontFamily && s.fontFamily !== 'default' ? `font-family: ${FONTS[s.fontFamily]} !important;` : ''}
      }
      ${s.paragraphSpacing ? `p { margin-bottom: ${s.paragraphSpacing}px !important; }` : ''}
    `;

    // High Contrast
    if (s.highContrast) {
      css += CONTRAST_THEMES[s.contrastTheme || 'dark'];
    }

    // Dark Mode
    if (s.darkMode && !s.highContrast) {
      const dmFilter = `brightness(${s.brightness ?? 100}%) saturate(${s.saturation ?? 100}%) invert(0.85) hue-rotate(180deg)`;
      css += `
        html { background: #111 !important; filter: ${dmFilter} !important; }
        html img, html video, html canvas, html svg { filter: invert(1) hue-rotate(180deg) !important; }
      `;
    }

    // Pause Animations
    if (s.pauseAnimations) {
      css += `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
        img[src$=".gif"] { visibility: hidden; }
      `;
    }

    // Highlight Links
    if (s.highlightLinks) {
      css += `
        a { 
          background: rgba(255,255,0,0.25) !important;
          outline: 2px solid #f59e0b !important;
          border-radius: 2px !important;
          text-decoration: underline !important;
        }
        a:hover { background: rgba(255,255,0,0.5) !important; }
      `;
    }

    // Highlight Headings
    if (s.highlightHeadings) {
      css += `
        h1,h2,h3,h4,h5,h6 {
          border-left: 4px solid #2563eb !important;
          padding-left: 8px !important;
          background: rgba(37,99,235,0.06) !important;
          border-radius: 0 6px 6px 0 !important;
        }
      `;
    }

    // TTS word highlight style
    css += `
      .equaled-tts-highlight {
        background: rgba(99,102,241,0.35) !important;
        border-radius: 2px !important;
        outline: 1px solid rgba(99,102,241,0.7) !important;
      }
    `;

    styleEl.textContent = css;
  }

  // Inject SVG color vision filters
  function injectColorFilterSVG() {
    if (document.getElementById('equaled-filters')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'equaled-filters';
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs>
        <filter id="eq-deuter">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="eq-protan">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"/>
        </filter>
        <filter id="eq-tritan">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"/>
        </filter>
      </defs>
    `;
    document.body.insertBefore(svg, document.body.firstChild);
  }

  // ══════════════════════════════════════════════════════
  //  TEXT-TO-SPEECH
  // ══════════════════════════════════════════════════════
  function applyTTS(s) {
    // Read on click
    if (s.ttsEnabled && s.ttsReadOnClick) {
      if (!document._equaledTtsClick) {
        document._equaledTtsClick = (e) => {
          const el = e.target.closest('p,h1,h2,h3,h4,h5,h6,li,td,th,label,span,a,button');
          if (el) { e.stopPropagation(); speakText(el.innerText); }
        };
        document.addEventListener('click', document._equaledTtsClick, true);
      }
    } else {
      if (document._equaledTtsClick) {
        document.removeEventListener('click', document._equaledTtsClick, true);
        document._equaledTtsClick = null;
      }
    }

    // Auto-read on page load
    if (s.ttsEnabled && s.ttsAutoRead && !ttsActive) {
      setTimeout(() => readPage(), 1500);
    }

    if (!s.ttsEnabled) stopTTS();
  }

  function speakText(text) {
    if (!text || !text.trim()) return;
    stopTTS();

    const s = settings;
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = s.ttsRate || 1.0;
    utterance.pitch = s.ttsPitch || 1.0;
    utterance.volume = s.ttsVolume ?? 1.0;

    if (s.ttsVoice) {
      const voices = speechSynthesis.getVoices();
      const match = voices.find(v => v.name === s.ttsVoice);
      if (match) utterance.voice = match;
    }

    if (s.ttsHighlight) {
      utterance.onboundary = (e) => {
        clearTTSHighlight();
        if (e.name !== 'word') return;
        highlightWord(e.charIndex, e.charLength, text);
      };
    }

    utterance.onend = () => { ttsActive = false; clearTTSHighlight(); };
    utterance.onerror = () => { ttsActive = false; clearTTSHighlight(); };

    ttsUtterance = utterance;
    ttsActive = true;
    ttsPaused = false;
    speechSynthesis.speak(utterance);
  }

  function readPage() {
    const content = document.querySelector('main, article, [role="main"], body');
    if (!content) return;
    const text = Array.from(
      content.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,td')
    ).map(el => el.innerText?.trim()).filter(Boolean).join(' ');
    speakText(text);
  }

  function pauseResumeTTS() {
    if (!ttsActive) return;
    if (ttsPaused) { speechSynthesis.resume(); ttsPaused = false; }
    else { speechSynthesis.pause(); ttsPaused = true; }
  }

  function stopTTS() {
    speechSynthesis.cancel();
    ttsActive = false; ttsPaused = false;
    clearTTSHighlight();
    if (ttsUtterance) ttsUtterance = null;
  }

  let ttsHighlightSpan = null;
  function highlightWord(charIndex, charLength, fullText) {
    clearTTSHighlight();
    const word = fullText.substr(charIndex, charLength);
    if (!word) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.textContent.indexOf(word);
      if (idx !== -1 && node.parentElement && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + word.length);
        ttsHighlightSpan = document.createElement('mark');
        ttsHighlightSpan.className = 'equaled-tts-highlight';
        ttsHighlightSpan.style.cssText = 'background:rgba(37,99,235,0.2);border-radius:2px;outline:1px solid rgba(37,99,235,0.5);';
        try { range.surroundContents(ttsHighlightSpan); } catch (_) { }
        break;
      }
    }
  }

  function clearTTSHighlight() {
    if (ttsHighlightSpan) {
      const parent = ttsHighlightSpan.parentNode;
      if (parent) {
        while (ttsHighlightSpan.firstChild) parent.insertBefore(ttsHighlightSpan.firstChild, ttsHighlightSpan);
        parent.removeChild(ttsHighlightSpan);
        parent.normalize();
      }
      ttsHighlightSpan = null;
    }
  }

  // ══════════════════════════════════════════════════════
  //  VOICE CONTROL
  // ══════════════════════════════════════════════════════
  function applyVoiceControl(s) {
    if (s.voiceEnabled) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  }

  function startVoiceRecognition() {
    if (voiceRecog) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    voiceRecog = new SR();
    voiceRecog.continuous = true;
    voiceRecog.interimResults = false;
    voiceRecog.lang = 'en-US';

    voiceRecog.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
      handleVoiceCommand(transcript);
    };

    voiceRecog.onerror = () => { };
    voiceRecog.onend = () => {
      if (settings.voiceEnabled) {
        setTimeout(() => { try { voiceRecog?.start(); } catch (_) { } }, 500);
      }
    };

    try { voiceRecog.start(); } catch (_) { }
    showNudge('🎙️ Voice control active');
  }

  function stopVoiceRecognition() {
    try { voiceRecog?.stop(); } catch (_) { }
    voiceRecog = null;
  }

  const SCROLL_AMOUNT = 300;
  function handleVoiceCommand(cmd) {
    showNudge(`🎙️ "${cmd}"`);

    if (cmd.includes('scroll down')) window.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
    else if (cmd.includes('scroll up')) window.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
    else if (cmd.includes('page down')) window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    else if (cmd.includes('page up')) window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    else if (cmd.includes('go back')) window.history.back();
    else if (cmd.includes('go forward')) window.history.forward();
    else if (cmd.includes('top') || cmd.includes('go to top')) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (cmd.includes('bottom') || cmd.includes('go to bottom')) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    else if (cmd.includes('read page') || cmd.includes('start reading')) readPage();
    else if (cmd.includes('stop reading') || cmd.includes('stop')) stopTTS();
    else if (cmd.includes('zoom in')) saveSetting('fontSize', Math.min(200, (settings.fontSize || 100) + 10));
    else if (cmd.includes('zoom out')) saveSetting('fontSize', Math.max(80, (settings.fontSize || 100) - 10));
    else if (cmd.includes('dark mode')) saveSetting('darkMode', !settings.darkMode);
    else if (cmd.includes('high contrast')) saveSetting('highContrast', !settings.highContrast);
    else if (cmd.includes('reset')) chrome.runtime.sendMessage({ type: 'RESET_ALL' });
    else if (cmd.startsWith('click ')) {
      const label = cmd.replace('click ', '').trim();
      const all = document.querySelectorAll('a, button, [role="button"]');
      for (const el of all) {
        if (el.innerText?.toLowerCase().includes(label)) { el.click(); break; }
      }
    }
  }

  function saveSetting(key, value) {
    settings[key] = value;
    chrome.storage.sync.set({ [key]: value });
    applyAll(settings);
  }

  // ══════════════════════════════════════════════════════
  //  READING GUIDE (horizontal ruler following mouse)
  // ══════════════════════════════════════════════════════
  function applyReadingGuide(s) {
    if (s.readingGuide) {
      if (!readingGuideEl) {
        readingGuideEl = document.createElement('div');
        readingGuideEl.id = 'equaled-reading-guide';
        Object.assign(readingGuideEl.style, {
          position: 'fixed', left: '0', width: '100%', height: '2px',
          background: 'rgba(37,99,235,0.75)',
          boxShadow: '0 0 10px rgba(37,99,235,0.4), 0 8px 24px rgba(37,99,235,0.06)',
          pointerEvents: 'none', zIndex: '999999',
          top: '0', transition: 'top 0.05s linear',
        });
        document.body.appendChild(readingGuideEl);
        document._equaledGuideMove = (e) => {
          if (readingGuideEl) readingGuideEl.style.top = `${e.clientY}px`;
        };
        document.addEventListener('mousemove', document._equaledGuideMove);
      }
    } else {
      readingGuideEl?.remove();
      readingGuideEl = null;
      if (document._equaledGuideMove) {
        document.removeEventListener('mousemove', document._equaledGuideMove);
        document._equaledGuideMove = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════
  //  READING MASK (dim above & below current line)
  // ══════════════════════════════════════════════════════
  const MASK_H = 60;
  function applyReadingMask(s) {
    if (s.readingMask) {
      if (!readingMaskEl) {
        readingMaskEl = document.createElement('div');
        readingMaskEl.id = 'equaled-mask';
        Object.assign(readingMaskEl.style, {
          position: 'fixed', left: '0', width: '100%', top: '0',
          pointerEvents: 'none', zIndex: '999998',
          background: 'transparent',
          boxShadow: 'none',
        });
        readingMaskEl._top = document.createElement('div');
        readingMaskEl._top.id = 'equaled-mask-top';
        readingMaskEl._bottom = document.createElement('div');
        readingMaskEl._bottom.id = 'equaled-mask-bottom';
        [readingMaskEl._top, readingMaskEl._bottom].forEach(el => {
          Object.assign(el.style, {
            position: 'fixed', left: '0', width: '100%',
            background: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none', zIndex: '999997',
          });
        });
        document.body.appendChild(readingMaskEl._top);
        document.body.appendChild(readingMaskEl._bottom);

        document._equaledMaskMove = (e) => {
          const y = e.clientY;
          const top = y - MASK_H;
          const bot = y + MASK_H;
          if (readingMaskEl._top) {
            readingMaskEl._top.style.top = '0';
            readingMaskEl._top.style.height = `${Math.max(0, top)}px`;
          }
          if (readingMaskEl._bottom) {
            readingMaskEl._bottom.style.top = `${bot}px`;
            readingMaskEl._bottom.style.height = `${Math.max(0, window.innerHeight - bot)}px`;
          }
        };
        document.addEventListener('mousemove', document._equaledMaskMove);
      }
    } else {
      readingMaskEl?._top?.remove();
      readingMaskEl?._bottom?.remove();
      readingMaskEl = null;
      if (document._equaledMaskMove) {
        document.removeEventListener('mousemove', document._equaledMaskMove);
        document._equaledMaskMove = null;
      }
    }
  }

  // ══════════════════════════════════════════════════════
  //  FOCUS MODE (spotlight around cursor)
  // ══════════════════════════════════════════════════════
  function applyFocusMode(s) {
    if (s.focusMode) {
      if (!focusOverlayEl) {
        focusOverlayEl = document.createElement('div');
        focusOverlayEl.id = 'equaled-focus';
        Object.assign(focusOverlayEl.style, {
          position: 'fixed', top: '0', left: '0',
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: '999996',
          background: 'radial-gradient(circle 180px at 50% 50%, transparent 120px, rgba(0,0,0,0.65) 240px)',
        });
        document.body.appendChild(focusOverlayEl);
        document._equaledFocusMove = (e) => {
          if (focusOverlayEl) {
            focusOverlayEl.style.background =
              `radial-gradient(circle 200px at ${e.clientX}px ${e.clientY}px, transparent 130px, rgba(0,0,0,0.65) 250px)`;
          }
        };
        document.addEventListener('mousemove', document._equaledFocusMove);
      }
    } else {
      focusOverlayEl?.remove();
      focusOverlayEl = null;
      if (document._equaledFocusMove) {
        document.removeEventListener('mousemove', document._equaledFocusMove);
        document._equaledFocusMove = null;
      }
    }
  }


  // ══════════════════════════════════════════════════════
  //  SHOW IMAGE ALT TEXT TOOLTIPS
  // ══════════════════════════════════════════════════════
  function applyAltText(s) {
    if (s.showAltText) {
      document.querySelectorAll('img').forEach(img => {
        const alt = img.getAttribute('alt');
        if (alt && alt.trim() && !img.dataset.equaledAlt) {
          img.dataset.equaledAlt = '1';
          const label = document.createElement('div');
          label.className = 'equaled-alt-label';
          label.textContent = `🖼 ${alt}`;
          Object.assign(label.style, {
            display: 'block', fontSize: '11px', fontStyle: 'italic',
            color: '#1d4ed8', background: 'rgba(37,99,235,0.07)',
            border: '1px solid rgba(37,99,235,0.2)',
            borderRadius: '4px', padding: '2px 6px', marginTop: '2px',
            fontFamily: "'Outfit', sans-serif",
            maxWidth: img.offsetWidth + 'px',
          });
          img.insertAdjacentElement('afterend', label);
        }
      });
    } else {
      document.querySelectorAll('.equaled-alt-label').forEach(l => l.remove());
      document.querySelectorAll('img[data-equaled-alt]').forEach(i => delete i.dataset.equaledAlt);
    }
  }

  // ══════════════════════════════════════════════════════
  //  DEFINE WORD (simple tooltip)
  // ══════════════════════════════════════════════════════
  function defineWord(word) {
    if (!word) return;
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
      .then(r => r.json())
      .then(data => {
        const def = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        if (def) showNudge(`📖 ${word}: ${def}`, 5000);
        else showNudge(`No definition found for "${word}"`);
      })
      .catch(() => showNudge(`Could not look up "${word}"`));
  }



  // ══════════════════════════════════════════════════════
  //  FLOATING QUICK-ACCESS PANEL (on-page mini panel)
  // ══════════════════════════════════════════════════════
  function toggleFloatingPanel() {
    if (floatingPanelEl) {
      floatingPanelEl.remove();
      floatingPanelEl = null;
    } else {
      createFloatingPanel();
    }
  }

  function createFloatingPanel() {
    floatingPanelEl = document.createElement('div');
    floatingPanelEl.id = 'equaled-panel';
    floatingPanelEl.innerHTML = `
      <div id="equaled-panel-header">
        <span>♿ EqualEd</span>
        <button id="equaled-panel-close">✕</button>
      </div>
      <div id="equaled-panel-body">
        <button class="eq-btn" data-action="font-up">A+ Font</button>
        <button class="eq-btn" data-action="font-down">A− Font</button>
        <button class="eq-btn" data-action="contrast">Contrast</button>
        <button class="eq-btn" data-action="dark">Dark Mode</button>
        <button class="eq-btn" data-action="links">Links</button>
        <button class="eq-btn" data-action="guide">Guide</button>
        <button class="eq-btn" data-action="mask">Mask</button>
        <button class="eq-btn" data-action="focus">Focus</button>
        <button class="eq-btn" data-action="tts">Read</button>
        <button class="eq-btn" data-action="stop">Stop</button>
        <button class="eq-btn" data-action="reset">Reset</button>
      </div>
    `;
    Object.assign(floatingPanelEl.style, {
      position: 'fixed', right: '16px', bottom: '80px',
      width: '190px', background: '#ffffff',
      border: '1.5px solid #dbeafe',
      borderRadius: '16px', boxShadow: '0 8px 32px rgba(37,99,235,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      zIndex: '9999999', fontFamily: "'Outfit', -apple-system, sans-serif",
      overflow: 'hidden',
    });
    document.body.appendChild(floatingPanelEl);

    floatingPanelEl.querySelector('#equaled-panel-close').addEventListener('click', () => {
      floatingPanelEl.remove(); floatingPanelEl = null;
    });

    floatingPanelEl.querySelector('#equaled-panel-header').style.cssText =
      'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:linear-gradient(135deg,#1d4ed8,#4f46e5,#7c3aed);color:#fff;font-size:14px;font-weight:800;font-family:Outfit,sans-serif;letter-spacing:-0.3px;';
    floatingPanelEl.querySelector('#equaled-panel-close').style.cssText =
      'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:14px;cursor:pointer;padding:2px 7px;line-height:1;border-radius:6px;font-family:inherit;';
    floatingPanelEl.querySelector('#equaled-panel-body').style.cssText =
      'display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:10px;background:#f9fafb;';

    floatingPanelEl.querySelectorAll('.eq-btn').forEach(btn => {
      btn.style.cssText = 'padding:6px 4px;background:#fff;border:1.5px solid #e5e7eb;border-radius:8px;color:#374151;font-size:11px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;transition:all 0.12s;';
      btn.addEventListener('mouseenter', () => { btn.style.background = '#eff6ff'; btn.style.borderColor = '#3b82f6'; btn.style.color = '#1d4ed8'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#fff'; btn.style.borderColor = '#e5e7eb'; btn.style.color = '#374151'; });

      btn.addEventListener('click', () => {
        const a = btn.dataset.action;
        if (a === 'font-up') saveSetting('fontSize', Math.min(200, (settings.fontSize || 100) + 10));
        else if (a === 'font-down') saveSetting('fontSize', Math.max(80, (settings.fontSize || 100) - 10));
        else if (a === 'contrast') saveSetting('highContrast', !settings.highContrast);
        else if (a === 'dark') saveSetting('darkMode', !settings.darkMode);
        else if (a === 'links') saveSetting('highlightLinks', !settings.highlightLinks);
        else if (a === 'guide') saveSetting('readingGuide', !settings.readingGuide);
        else if (a === 'mask') saveSetting('readingMask', !settings.readingMask);
        else if (a === 'focus') saveSetting('focusMode', !settings.focusMode);
        else if (a === 'tts') readPage();
        else if (a === 'stop') stopTTS();
        else if (a === 'reset') chrome.runtime.sendMessage({ type: 'RESET_ALL' });
      });
    });

    // Make panel draggable
    makeDraggable(floatingPanelEl, floatingPanelEl.querySelector('#equaled-panel-header'));
  }

  function updateFloatingPanel() { /* panel auto-updates via CSS */ }

  function makeDraggable(el, handle) {
    let ox, oy;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', (e) => {
      ox = e.clientX - el.getBoundingClientRect().left;
      oy = e.clientY - el.getBoundingClientRect().top;
      handle.style.cursor = 'grabbing';
      const onMove = (e) => {
        el.style.left = `${e.clientX - ox}px`;
        el.style.top = `${e.clientY - oy}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      };
      const onUp = () => {
        handle.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ══════════════════════════════════════════════════════
  //  NUDGE TOAST (on-page feedback)
  // ══════════════════════════════════════════════════════
  let nudgeEl = null;
  let nudgeT = null;
  function showNudge(text, duration = 2000) {
    if (!nudgeEl) {
      nudgeEl = document.createElement('div');
      nudgeEl.id = 'equaled-nudge';
      Object.assign(nudgeEl.style, {
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%) translateY(10px)',
        background: '#1f2937',
        border: '1.5px solid #2563eb',
        color: '#ffffff',
        padding: '8px 20px', borderRadius: '99px',
        fontSize: '13px', fontWeight: '600',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        pointerEvents: 'none', zIndex: '999999999',
        boxShadow: '0 4px 20px rgba(37,99,235,0.25), 0 2px 8px rgba(0,0,0,0.2)',
        opacity: '0', transition: 'opacity 0.2s, transform 0.2s',
        whiteSpace: 'nowrap', maxWidth: '80vw',
        overflow: 'hidden', textOverflow: 'ellipsis',
      });
      document.body.appendChild(nudgeEl);
    }
    nudgeEl.textContent = text;
    nudgeEl.style.opacity = '1';
    nudgeEl.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(nudgeT);
    nudgeT = setTimeout(() => {
      if (nudgeEl) {
        nudgeEl.style.opacity = '0';
        nudgeEl.style.transform = 'translateX(-50%) translateY(10px)';
      }
    }, duration);
  }

})();
