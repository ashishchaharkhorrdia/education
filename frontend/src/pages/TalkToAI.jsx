import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Bot, ArrowLeft, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../utils/api';
import { speak as sarvamSpeak, stopSpeaking } from '../services/textToSpeech';


const STATE = {
  IDLE: 'idle',
  RECORDING: 'recording',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
};

// ── Helper: get JWT token ─────────────────────────────────────────────────────
const getToken = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored)?.token : null;
  } catch { return null; }
};

// ── Chat Bubble Component ─────────────────────────────────────────────────────
const Bubble = ({ role, text }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
    <div
      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
        ${role === 'user'
          ? 'bg-indigo-600 text-white rounded-br-none'
          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
    >
      {role === 'ai' && (
        <span className="flex items-center gap-1 text-xs text-indigo-500 font-semibold mb-1">
          <Bot size={12} /> CyberNinjas AI Assistant
        </span>
      )}
      {text}
    </div>
  </div>
);


const TalkToAI = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appState, setAppState] = useState(STATE.IDLE);
  const [messages, setMessages] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const isRecording = useRef(false);
  const audioContextRef = useRef(null);
  const maxDurationTimerRef = useRef(null);

  const getHomeRouteForRole = useCallback((role) => {
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'teacher') return '/teacher-dashboard';
    return '/dashboard';
  }, []);

  // Redirect non-students
  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate(getHomeRouteForRole(user.role), { replace: true });
    }
  }, [user, navigate, getHomeRouteForRole]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopSpeaking();
    };
  }, []);

  // ── Sarvam STT: transcribe recorded blob ──────────────────────────────────
  const transcribeAudio = useCallback(async (blob) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('language_code', 'unknown'); // auto-detect Hi/En
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
      throw new Error(err.message || 'STT failed');
    }

    const data = await response.json();
    return data.transcript?.trim() || '';
  }, []);

  // ── Sarvam Chat ───────────────────────────────────────────────────────────
  const askAI = useCallback(async (userMessage) => {
    setAppState(STATE.THINKING);
    setInterimText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setErrorMsg('');

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ? `${data.message} Detail: ${data.error}` : data.message || 'Server error');
      }
      const reply = data.reply || 'Sorry, I could not understand that.';

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      setAppState(STATE.SPEAKING);

      // Detect language for TTS
      const isHindi = /[\u0900-\u097F]/.test(reply);
      sarvamSpeak(reply, isHindi ? 'hi-IN' : 'en-IN', () => {
        setAppState(STATE.IDLE);
        startRecording(); // auto-restart microphone
      });
    } catch (err) {
      console.error('[TalkToAI] Error:', err.message);
      setErrorMsg(`${err.message}`);
      setAppState(STATE.IDLE);
    }
  }, []);

  // ── MediaRecorder: start ──────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording.current) return;

    window.dispatchEvent(new Event('equaled:stt-start'));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        isRecording.current = false;
        window.dispatchEvent(new Event('equaled:stt-end'));

        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }

        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch { }
          audioContextRef.current = null;
        }

        if (chunksRef.current.length === 0) {
          setAppState(STATE.IDLE);
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        setAppState(STATE.THINKING);
        setInterimText('Transcribing...');

        try {
          const transcript = await transcribeAudio(blob);
          setInterimText('');
          if (transcript) {
            await askAI(transcript);
          } else {
            setErrorMsg('Could not understand. Please try again.');
            setAppState(STATE.IDLE);
          }
        } catch (err) {
          console.error('[TalkToAI] STT error:', err.message);
          setErrorMsg('Could not transcribe audio. Please try again.');
          setAppState(STATE.IDLE);
          setInterimText('');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      isRecording.current = true;
      setAppState(STATE.RECORDING);
      setErrorMsg('');

      // Enforce 28-second max duration to avoid Sarvam 30s limit
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording.current && mediaRecorderRef.current?.state !== 'inactive') {
          console.warn('[TalkToAI] Max duration reached, stopping automatically');
          mediaRecorderRef.current.stop();
        }
      }, 28000);

      // Silence Detection (VAD)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        // Ensure AudioContext is not suspended (happens on page auto-load)
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(err => console.warn('[VAD] Resume failed:', err));
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.minDecibels = -65;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let silenceTimer = null;
        let hasStartedTalking = false;

        const checkAudio = () => {
          if (!isRecording.current) return;
          analyser.getByteFrequencyData(dataArray);

          let maxVolume = 0;
          for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxVolume) {
              maxVolume = dataArray[i];
            }
          }

          // maxVolume ranges from 0 to 255. > 15 means some sound detected.
          if (maxVolume > 15) {
            hasStartedTalking = true;
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          } else {
            // Silence detected
            if (hasStartedTalking && !silenceTimer) {
              silenceTimer = setTimeout(() => {
                if (isRecording.current && recorder.state !== 'inactive') {
                  console.log('[VAD] Silence detected, auto-sending...');
                  recorder.stop();
                }
              }, 1500); // Wait 1.5 seconds of silence before sending
            }
          }
          if (isRecording.current) {
            requestAnimationFrame(checkAudio);
          }
        };
        checkAudio();
      }
    } catch (err) {
      console.warn('[TalkToAI] Mic error:', err.message);
      isRecording.current = false;
      window.dispatchEvent(new Event('equaled:stt-end'));
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission denied. Allow mic access in your browser.');
      } else {
        setErrorMsg('Could not access microphone. Please try again.');
      }
      setAppState(STATE.IDLE);
    }
  }, [transcribeAudio, askAI]);

  // ── MediaRecorder: stop ───────────────────────────────────────────────────
  const stopRecording = useCallback((cancel = false) => {
    if (cancel === true) {
      chunksRef.current = [];
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { }
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { }
      audioContextRef.current = null;
    }
    stopSpeaking();
    isRecording.current = false;
    window.dispatchEvent(new Event('equaled:stt-end'));
    setAppState(STATE.IDLE);
    setInterimText('');
  }, []);

  // Removed auto-start on page load so it waits for user input first.

  // Mic button handler
  const handleMicClick = () => {
    if (appState === STATE.RECORDING) {
      // Tap to Stop & Send to AI (manual override)
      stopRecording();
    } else if (appState === STATE.IDLE) {
      // Tap to Unmute/Listen
      startRecording();
    } else if (appState === STATE.SPEAKING) {
      // Tap to Interrupt AI
      stopSpeaking();
      stopRecording(true);
      setAppState(STATE.IDLE);
    }
  };

  // UI helpers
  const stateConfig = {
    [STATE.IDLE]: { label: 'Tap mic to speak', color: 'from-gray-400 to-gray-500', ring: '' },
    [STATE.RECORDING]: { label: 'Recording... tap to send', color: 'from-indigo-500 to-purple-600', ring: 'ring-4 ring-indigo-300 ring-offset-4 animate-pulse' },
    [STATE.THINKING]: { label: 'Sarvam AI thinking...', color: 'from-amber-400 to-orange-500', ring: 'ring-4 ring-amber-300 ring-offset-4' },
    [STATE.SPEAKING]: { label: 'Sarvam AI speaking... tap to interrupt', color: 'from-green-500 to-emerald-600', ring: 'ring-4 ring-green-300 ring-offset-4 animate-pulse' },
  };

  const cfg = stateConfig[appState];

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-center p-8">
          Your browser does not support audio recording. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-none">AI Learning Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Sarvam AI · Student exclusive</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${appState === STATE.RECORDING ? 'bg-indigo-500 animate-pulse' :
              appState === STATE.THINKING ? 'bg-amber-500 animate-bounce' :
                appState === STATE.SPEAKING ? 'bg-green-500 animate-pulse' :
                  'bg-gray-300'
            }`} />
          <span className="text-xs text-gray-500 capitalize">{appState}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Chat transcript */}
        {(messages.length > 0 || interimText || appState === STATE.THINKING || errorMsg) && (
          <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl w-full mx-auto">
            {messages.map((msg, i) => (
              <Bubble key={i} role={msg.role} text={msg.text} />
            ))}
            {interimText && (
              <div className="flex justify-end mb-3">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-none bg-indigo-100 text-indigo-600 text-sm italic border border-indigo-200">
                  🎤 {interimText}
                </div>
              </div>
            )}
            {appState === STATE.THINKING && (
              <div className="flex justify-start mb-3">
                <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-gray-100 shadow-sm flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin text-indigo-500" />
                  Thinking...
                </div>
              </div>
            )}
            {errorMsg && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl text-center my-2">{errorMsg}</p>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Mic control area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-8">

          {/* Welcome message */}
          {messages.length === 0 && !interimText && appState !== STATE.THINKING && (
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-700">Hello, {user?.name?.split(' ')[0]}! 👋</h2>
              <p className="text-gray-400 text-sm mt-1">Tap the mic and ask me anything</p>
            </div>
          )}

          {/* State label */}
          <p className="text-sm font-semibold tracking-wide h-5 text-center text-gray-500">
            {cfg.label}
          </p>

          {/* Mic button with rings */}
          <div className="relative flex items-center justify-center">
            {(appState === STATE.RECORDING || appState === STATE.SPEAKING) && (
              <span className={`absolute w-40 h-40 rounded-full animate-ping opacity-15
                ${appState === STATE.RECORDING ? 'bg-indigo-400' : 'bg-green-400'}`}
              />
            )}
            {(appState === STATE.RECORDING || appState === STATE.SPEAKING) && (
              <span className={`absolute w-32 h-32 rounded-full border-4 animate-pulse opacity-25
                ${appState === STATE.RECORDING ? 'border-indigo-400' : 'border-green-400'}`}
              />
            )}

            <button
              onClick={handleMicClick}
              disabled={appState === STATE.THINKING}
              className={`
                relative w-28 h-28 rounded-full flex items-center justify-center z-10
                bg-gradient-to-br ${cfg.color}
                text-white shadow-2xl transition-all duration-300
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
              `}
              aria-label={appState === STATE.RECORDING ? 'Pause' : appState === STATE.SPEAKING ? 'Interrupt' : 'Start'}
            >
              {appState === STATE.THINKING ? (
                <Loader2 size={44} className="animate-spin" />
              ) : appState === STATE.SPEAKING ? (
                <Volume2 size={44} className="animate-pulse" />
              ) : appState === STATE.RECORDING ? (
                <MicOff size={44} className="animate-pulse" />
              ) : (
                <Mic size={44} />
              )}
            </button>
          </div>

          {/* Hint text */}
          <p className="text-xs text-gray-400 h-4 text-center">
            {appState === STATE.IDLE ? 'Tap to start' : ''}
            {appState === STATE.RECORDING ? 'Tap to send immediately' : ''}
            {appState === STATE.THINKING ? 'Please wait...' : ''}
            {appState === STATE.SPEAKING ? 'Tap to interrupt' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TalkToAI;
