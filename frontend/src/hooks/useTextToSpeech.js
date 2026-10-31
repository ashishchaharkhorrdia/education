import { useState, useCallback } from 'react';
import { speak as sarvamSpeak, stopSpeaking } from '../services/textToSpeech';

/**
 * useTextToSpeech – powered by Sarvam AI TTS via backend proxy.
 *
 * Exposes the same interface as the previous browser-synthesis hook
 * so all existing consumers continue to work unchanged.
 */
export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text, lang) => {
    setIsSpeaking(true);
    try {
      await new Promise((resolve) => {
        sarvamSpeak(text, lang, resolve);
      });
    } catch (err) {
      console.warn('[useTextToSpeech] speak error:', err);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // pause / resume kept as no-ops for API compatibility
  const pause = useCallback(() => {}, []);
  const resume = useCallback(() => {}, []);

  return { speak, stop, pause, resume, isSpeaking, voices: [] };
};
