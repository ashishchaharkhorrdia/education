import { useEffect } from 'react';
import { useSpeechToText } from './useSpeechToText';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTextToSpeech } from './useTextToSpeech';

export const useVoiceCommands = () => {
  const { transcript, resetTranscript, startListening } = useSpeechToText();
  const { 
    increaseFont, decreaseFont, 
    toggleContrast, toggleFocusMode, 
    toggleCaptions 
  } = useAccessibility();
  const { speak, stop } = useTextToSpeech();

  useEffect(() => {
    startListening();
  }, []);

  useEffect(() => {
    if (!transcript) return;

    const lowerTranscript = transcript.toLowerCase();
    const lastCommand = lowerTranscript.split(' ').slice(-5).join(' '); 

    if (lastCommand.includes('read lesson') || lastCommand.includes('read page')) {
      
      
      window.dispatchEvent(new CustomEvent('voice-command', { detail: 'read' }));
      resetTranscript();
    } else if (lastCommand.includes('stop reading') || lastCommand.includes('stop')) {
      stop();
      resetTranscript();
    } else if (lastCommand.includes('increase font') || lastCommand.includes('bigger font')) {
      increaseFont();
      speak("Increasing font size");
      resetTranscript();
    } else if (lastCommand.includes('decrease font') || lastCommand.includes('smaller font')) {
      decreaseFont();
      speak("Decreasing font size");
      resetTranscript();
    } else if (lastCommand.includes('enable contrast') || lastCommand.includes('high contrast')) {
      toggleContrast();
      speak("High contrast enabled");
      resetTranscript();
    } else if (lastCommand.includes('disable contrast')) {
      toggleContrast(); 
      speak("High contrast disabled");
      resetTranscript();
    } else if (lastCommand.includes('focus mode') || lastCommand.includes('enable focus')) {
      toggleFocusMode();
      speak("Focus mode enabled");
      resetTranscript();
    }
  }, [transcript, increaseFont, decreaseFont, toggleContrast, toggleFocusMode, speak, stop, resetTranscript]);

  return { transcript };
};
