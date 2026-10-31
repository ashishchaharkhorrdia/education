import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Globe, HelpCircle, X } from 'lucide-react';
import { useVoiceControl } from '../hooks/useVoiceControl';
import { useAccessibility } from '../context/AccessibilityContext';

const Toast = ({ msg, type }) => {
  if (!msg) return null;
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[999999]
        px-5 py-2 rounded-full text-white text-sm font-semibold shadow-lg
        transition-all duration-300 pointer-events-none
        ${colors[type] || 'bg-gray-700'}`}
    >
      {msg}
    </div>
  );
};

const Transcript = ({ text, interim }) => {
  if (!text) return null;
  return (
    <div
      aria-live="polite"
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[999998]
        max-w-xs px-4 py-2 rounded-2xl text-sm shadow-xl
        ${interim
          ? 'bg-white/80 text-gray-500 border border-gray-200 backdrop-blur'
          : 'bg-white text-gray-800 border border-gray-300 backdrop-blur'}`}
    >
      🎤 {text}
    </div>
  );
};

const VoiceAssistant = () => {
  const accessibility = useAccessibility();
  const { voiceEnabled, voiceLang, toggleVoice, setVoiceLang, isAwake, setIsAwake, highContrast } = accessibility;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', type: 'success' });
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('voice_assistant_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 90, y: window.innerHeight - 120 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    if (!transcript) return;
    const t = setTimeout(() => setTranscript(''), 5000);
    return () => clearTimeout(t);
  }, [transcript]);

  useEffect(() => {
    if (!feedback.msg) return;
    const t = setTimeout(() => setFeedback({ msg: '', type: 'success' }), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleTranscript = useCallback((text, isInterim) => {
    setTranscript(text);
    setInterim(isInterim);
  }, []);

  const handleFeedback = useCallback((msg, type) => {
    setFeedback({ msg, type });
    setTranscript('');
  }, []);

  const handleListening = useCallback((val) => {
    setListening(val);
    if (!val) setTranscript('');
  }, []);

  useEffect(() => {
    const handler = () => { if (voiceEnabled) toggleVoice(); };
    window.addEventListener('equaled:voice-disable', handler);
    return () => window.removeEventListener('equaled:voice-disable', handler);
  }, [voiceEnabled, toggleVoice]);

  const onPointerDown = (e) => {
    setIsDragging(true);
    setMoved(false);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setMoved(true);
    }
    const boundedX = Math.max(80, Math.min(window.innerWidth - 80, newX));
    const boundedY = Math.max(80, Math.min(window.innerHeight - 80, newY));
    setPosition({ x: boundedX, y: boundedY });
  };

  const onPointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    localStorage.setItem('voice_assistant_pos', JSON.stringify(position));
  };

  const handleToggle = () => {
    if (!moved) {
      if (!voiceEnabled) {
        toggleVoice();
        setTimeout(() => setIsAwake(true), 150);
      } else if (isAwake) {
        setIsAwake(false);
      } else {
        setIsAwake(true);
      }
    }
  };

  const { supported, permDenied } = useVoiceControl({
    enabled: voiceEnabled,
    lang: voiceLang,
    accessibility,
    onTranscript: handleTranscript,
    onFeedback: handleFeedback,
    onListening: handleListening,
  });

  if (!supported) return null;

  const langs = [
    { code: 'en-US', label: 'English' },
    { code: 'hi-IN', label: 'Auto (HI/EN)' },
  ];

  return (
    <>
      {feedback.msg && isAwake && !transcript && <Toast msg={feedback.msg} type={feedback.type} />}

      {transcript && isAwake && <Transcript text={transcript} interim={interim} />}

      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">🎙️ Voice Commands</h3>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 text-sm">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-2">
                <p className="font-bold text-indigo-700 underline">Wake Word:</p>
                <p className="text-indigo-900 mt-1">Say "वॉइस कमांड ऑन" (Voice command on)</p>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-600 mb-1">Navigation</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-700">
                  <li>"Go to Dashboard" / "डैशबोर्ड खोलो"</li>
                  <li>"Go Home" / "घर जाओ"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-indigo-600 mb-1">Accessibility</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-700">
                  <li>"Enable Visual Mode" / "विजुअल मोड ऑन"</li>
                  <li>"Reset Settings" / "सेटिंग्स रिसेट करो"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed z-[999998] flex flex-col items-center gap-2 transition-transform duration-75 ${isDragging ? 'scale-105 opacity-90 cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          touchAction: 'none'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {showLangMenu && (
          <div className="absolute bottom-24 bg-white/95 backdrop-blur border border-gray-100 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 w-32 animate-in slide-in-from-bottom-2 fade-in">
            {langs.map(l => (
              <button
                key={l.code}
                onClick={(e) => { e.stopPropagation(); setVoiceLang(l.code); setShowLangMenu(false); }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${voiceLang === l.code ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {!isAwake && !listening && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowHelp(true); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-white/90 border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <HelpCircle size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowLangMenu(m => !m); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 border border-gray-200 text-gray-600 text-[10px] font-bold shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Globe size={14} />
              {langs.find(l => l.code === voiceLang)?.label.split(' ')[0] || 'EN'}
            </button>
          </div>
        )}

        <button
          onClick={handleToggle}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={permDenied}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            text-white shadow-2xl transition-all duration-300
            ${isAwake
              ? 'bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 scale-110 shadow-cyan-500/40'
              : 'bg-gradient-to-br from-sky-500 to-violet-600 text-white border border-sky-200 shadow-lg shadow-sky-500/30'}
            ${highContrast ? 'high-contrast:bg-yellow-400 high-contrast:text-black' : ''}
          `}
        >
          {listening && (
            <>
              <span className={`absolute inset-0 rounded-full animate-ping opacity-25 ${isAwake ? 'bg-cyan-300' : 'bg-blue-200'}`} />
              <span className={`absolute inset-[-4px] rounded-full border-2 animate-pulse opacity-50 ${isAwake ? 'border-cyan-300' : 'border-sky-200'}`} />
            </>
          )}
          {isAwake ? (
            <Mic size={32} className="animate-pulse" />
          ) : (
            <Mic size={28} className={listening ? 'text-cyan-100' : 'text-white/80'} />
          )}
        </button>

        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm
          ${permDenied ? 'bg-red-50 text-red-500 border-red-100' :
            isAwake ? 'bg-cyan-600 text-white border-cyan-500' :
              listening ? 'bg-sky-50 text-sky-600 border-sky-100' :
                'bg-white text-sky-600 border-sky-100'}`}
        >
          {permDenied ? '🚫 No Mic' :
            isAwake ? 'Active' :
              listening ? 'Listening...' :
                voiceEnabled ? 'Ready' :
                  'Deactivated'}
        </span>
      </div>
    </>
  );
};

export default VoiceAssistant;
