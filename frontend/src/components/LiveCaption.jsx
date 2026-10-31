import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useSpeechToText } from '../hooks/useSpeechToText';

const LiveCaption = () => {
    const { captionsEnabled, highContrast, fontSize } = useAccessibility();
    const { transcript } = useSpeechToText();

    if (!captionsEnabled || !transcript) return null;

    
    const displayText = transcript.split(' ').slice(-15).join(' ');

    return (
        <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl z-50 shadow-2xl max-w-3xl w-full text-center transition-all duration-300 ${
            highContrast 
                ? 'bg-black border-2 border-yellow-400 text-yellow-400' 
                : 'bg-black/80 backdrop-blur-md text-white'
        }`}>
            <p style={{ fontSize: `${Math.max(fontSize, 20)}px` }} className="font-medium leading-relaxed">
                {displayText}
            </p>
        </div>
    );
};

export default LiveCaption;
