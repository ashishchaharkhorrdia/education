/**
 * Sarvam AI Text-to-Speech service
 *
 * Calls the backend proxy at /api/ai/tts, which forwards to Sarvam's
 * https://api.sarvam.ai/text-to-speech endpoint.
 * The response is a base64-encoded WAV string that we decode and play
 * via the Web Audio API so it works across all browsers without issues.
 */

import API_BASE from '../utils/api';

const getToken = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored)?.token : null;
  } catch {
    return null;
  }
};

/**
 * Detect if text is predominantly Hindi/Indic.
 * Returns 'hi-IN' for Hindi script, 'en-IN' otherwise.
 */
const detectLanguage = (text) => {
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  return hindiChars > text.length * 0.15 ? 'hi-IN' : 'en-IN';
};

/**
 * Pick a Sarvam speaker appropriate for the language (bulbul:v3).
 */
const pickSarvamSpeaker = (lang) => {
  return lang === 'hi-IN' ? 'aditya' : 'priya';
};

let _audioCtx = null;
const getAudioCtx = () => {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
};

let _currentSource = null;

/**
 * Main speak function – calls Sarvam TTS via backend and plays audio.
 * @param {string} text   Text to speak
 * @param {string} lang   BCP-47 language code (e.g. 'hi-IN', 'en-IN')
 * @param {Function} [onEnd]  Called when playback ends
 */
export const speak = async (text, lang, onEnd) => {
  if (!text || !text.trim()) { onEnd?.(); return; }

  const resolvedLang = lang || detectLanguage(text);
  const speaker = pickSarvamSpeaker(resolvedLang);
  const token = getToken();

  try {
    // Stop any currently playing audio
    stopSpeaking();

    const response = await fetch(`${API_BASE}/api/ai/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text: text.trim(),
        language_code: resolvedLang,
        speaker,
        pace: 1.0,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'TTS request failed');
    }

    const data = await response.json();
    const audioBase64 = data.audio;
    if (!audioBase64) throw new Error('No audio received');

    // Decode base64 → ArrayBuffer → AudioBuffer → play
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    _currentSource = source;
    source.onended = () => {
      _currentSource = null;
      onEnd?.();
    };
    source.start();
  } catch (err) {
    console.warn('[Sarvam TTS] Error, falling back to Web Speech:', err.message);
    // Graceful fallback to browser speech synthesis
    _fallbackSpeak(text, resolvedLang, onEnd);
  }
};

/** Fallback to browser speechSynthesis if Sarvam TTS fails */
const _fallbackSpeak = (text, lang, onEnd) => {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || 'en-IN';
  utterance.rate = 0.95;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
};

/** Stop any audio currently playing */
export const stopSpeaking = () => {
  if (_currentSource) {
    try { _currentSource.stop(); } catch {}
    _currentSource = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};

export const isTTSSupported = () => true;
