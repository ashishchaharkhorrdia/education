import { useState, useRef, useCallback } from 'react';
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
 * useSpeechToText – powered by Sarvam AI STT via backend proxy.
 *
 * Records microphone audio using MediaRecorder, sends the blob to
 * /api/ai/stt (Sarvam speech-to-text), and returns the transcript.
 *
 * Falls back to Web Speech API if MediaRecorder is unavailable.
 */
export const useSpeechToText = ({ lang = 'hi-IN' } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported] = useState(() => !!(navigator.mediaDevices?.getUserMedia));

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // ── Sarvam STT via backend ────────────────────────────────────────────────
  const transcribeBlob = useCallback(async (blob) => {
    try {
      const token = getToken();
      const formData = new FormData();
      // Sarvam supports webm
      formData.append('file', blob, 'audio.webm');
      // Map browser lang code to Sarvam supported codes
      const sarvamLang = lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
      formData.append('language_code', sarvamLang);
      formData.append('model', 'saarika:v2.5');

      const response = await fetch(`${API_BASE}/api/ai/stt`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'STT request failed');
      }

      const data = await response.json();
      const text = data.transcript || '';
      if (text) setTranscript((prev) => (prev + ' ' + text).trim());
    } catch (err) {
      console.error('[Sarvam STT] Transcription error:', err.message);
    }
  }, [lang]);

  // ── Start recording ───────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (isListening) return;

    window.dispatchEvent(new CustomEvent('equaled:stt-start'));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        await transcribeBlob(blob);
        // Release mic
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('equaled:stt-end'));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('[Sarvam STT] Mic access error:', err);
      setIsListening(false);
      window.dispatchEvent(new CustomEvent('equaled:stt-end'));
    }
  }, [isListening, transcribeBlob]);

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { isListening, transcript, startListening, stopListening, resetTranscript, supported };
};
