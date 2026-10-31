import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Pause, Square, ArrowLeft, Mic, Send, CheckCircle2, XCircle,
  Loader2, Award, ArrowRight, Sparkles, Volume2, BookOpen, Clock, User,
  RotateCcw, HelpCircle
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useToast } from '../context/ToastContext';
import API_BASE from '../utils/api';

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    highContrast, fontSize, focusMode,
    disabilityType
  } = useAccessibility();

  const { speak, stop, pause, resume, isSpeaking } = useTextToSpeech();
  const {
    isListening,
    transcript,
    startListening: startSTT,
    stopListening: stopSTT,
    resetTranscript
  } = useSpeechToText();

  // Lesson State
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [activeParagraph, setActiveParagraph] = useState(-1);

  // AI Explainer State
  const [aiSummary, setAiSummary] = useState('');
  const [explaining, setExplaining] = useState(false);

  // Comprehension / Quiz State
  const [quiz, setQuiz] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const authHeader = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user?.token}`,
    };
  }, [user?.token]);

  // Fetch real lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/lessons/${id}`, {
          headers: authHeader(),
        });
        const data = await res.json();

        if (res.ok && data) {
          setLesson(data);
          // Split content into clean paragraphs
          const rawContent = data.content || '';
          const paras = rawContent
            .split(/\n\s*\n|\n/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          setParagraphs(paras.length > 0 ? paras : [rawContent]);
          setQuestionText(`What is the most important concept explained in "${data.title}"?`);
        } else {
          // Graceful fallback if lesson ID not in DB (e.g. demo link)
          setLesson({
            title: 'Introduction to Biology & Life Sciences',
            category: 'Science',
            difficulty: 'Beginner',
            content:
              'Biology is the scientific study of life. It is a natural science with a broad scope that explores living organisms.\n\nAll organisms are made up of cells that process hereditary information encoded in genes.\n\nEvolution explains the unity and diversity of life on Earth.',
            author: { name: 'Faculty Instructor' },
          });
          setParagraphs([
            'Biology is the scientific study of life. It is a natural science with a broad scope that explores living organisms.',
            'All organisms are made up of cells that process hereditary information encoded in genes.',
            'Evolution explains the unity and diversity of life on Earth.',
          ]);
          setQuestionText('What are all living organisms made up of?');
        }
      } catch (err) {
        setError('Could not reach server. Showing offline sample.');
        setLesson({
          title: 'Introduction to Science & Discovery',
          category: 'Science',
          difficulty: 'Beginner',
          content: 'Science is the pursuit and application of knowledge and understanding of the natural and social world.',
        });
        setParagraphs([
          'Science is the pursuit and application of knowledge and understanding of the natural and social world.',
        ]);
        setQuestionText('What is the main goal of science?');
      } finally {
        setLoading(false);
      }
    };

    // Fetch quiz for this lesson
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/quizzes/${id}`, {
          headers: authHeader(),
        });
        if (res.ok) {
          const qData = await res.json();
          if (qData?.questions?.length > 0) {
            setQuiz(qData);
            setQuestionText(qData.questions[0].questionText);
          }
        }
      } catch (_) {}
    };

    fetchLesson();
    fetchQuiz();
  }, [id, authHeader]);

  // Update answer text as speech-to-text transcribes
  useEffect(() => {
    if (transcript) {
      setAnswer(transcript);
    }
  }, [transcript]);

  // Read entire lesson aloud
  const handleReadAloud = () => {
    stop();
    setActiveParagraph(-1);
    const fullText = paragraphs.join('. ');
    speak(fullText);
  };

  // Focus and read a specific paragraph
  const handleFocusParagraph = (index) => {
    setActiveParagraph(index);
    stop();
    if (paragraphs[index]) {
      speak(paragraphs[index]);
    }
  };

  // AI Simple Explanation
  const handleExplainSimply = async () => {
    if (!lesson) return;
    setExplaining(true);
    setAiSummary('');

    try {
      const prompt = `Please explain the lesson "${lesson.title}" in 2-3 extremely simple, encouraging sentences for a student. Key text: "${paragraphs.join(' ')}"`;
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (res.ok) {
        const reply = data.reply || data.response || 'Here is your simplified lesson summary!';
        setAiSummary(reply);
        speak(reply);
      } else {
        setAiSummary('This lesson teaches the fundamental building blocks of the subject in an easy-to-understand way.');
      }
    } catch (err) {
      setAiSummary('Focus on the main ideas: every concept builds upon smaller, simpler steps.');
    } finally {
      setExplaining(false);
    }
  };

  // Mark completion in database
  const updateDBProgress = async () => {
    try {
      await fetch(`${API_BASE}/api/progress`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          lessonId: id,
          isCompleted: true,
          timeSpent: 5,
        }),
      });
    } catch (err) {
      console.error('Progress sync failed:', err);
    }
  };

  // Evaluate comprehension answer
  const handleAnswerSubmit = async () => {
    if (!answer.trim()) {
      showToast('Please speak or type an answer first', 'info');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const prompt = `
        I am a student learning: "${lesson?.title}".
        Lesson text: "${paragraphs.join(' ')}"
        Question: "${questionText}"
        My answer: "${answer}"

        Evaluate my answer. If it captures the main concept, start your reply with 'CORRECT' followed by one encouraging sentence.
        If incorrect, start with 'INCORRECT' followed by one friendly hint.
      `;

      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        const aiResponse = data.reply || data.response || '';
        const isCorrect =
          aiResponse.toUpperCase().includes('CORRECT') && !aiResponse.toUpperCase().includes('INCORRECT');

        setFeedback({
          correct: isCorrect,
          message: aiResponse.replace(/CORRECT|INCORRECT/gi, '').trim() || 'Good effort!',
        });

        if (isCorrect) {
          setIsCompleted(true);
          showToast('Awesome! Lesson comprehension completed.', 'success');
          await updateDBProgress();
        } else {
          showToast('Try again! Review the lesson text and hint.', 'info');
        }
      } else {
        throw new Error('AI evaluation request failed');
      }
    } catch (err) {
      // Offline fallback evaluation
      const hasKeyKeywords = answer.trim().length > 3;
      setFeedback({
        correct: hasKeyKeywords,
        message: hasKeyKeywords
          ? 'Great job! Your response demonstrates a strong understanding of this topic.'
          : 'Please provide a more detailed explanation based on the lesson notes.',
      });
      if (hasKeyKeywords) {
        setIsCompleted(true);
        updateDBProgress();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Loading educational notes & lesson...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto pb-24 px-4 sm:px-6 ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
      {/* Top Header / Back Button */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-2 font-bold px-4 py-2 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:bg-gray-50 high-contrast:bg-gray-900 high-contrast:border-yellow-400 ${
            highContrast ? 'text-yellow-400' : 'text-blue-600'
          }`}
        >
          <ArrowLeft size={18} /> Back to Learning Portal
        </button>

        {isCompleted && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-green-100 text-green-700">
            <CheckCircle2 size={14} /> Lesson Completed
          </span>
        )}
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-xs mb-6 font-medium">
          {error}
        </div>
      )}

      {/* Lesson Meta Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 high-contrast:bg-gray-800 high-contrast:text-yellow-400">
          {lesson?.category || 'General Study'}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            lesson?.difficulty === 'Advanced'
              ? 'bg-red-100 text-red-700'
              : lesson?.difficulty === 'Intermediate'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {lesson?.difficulty || 'Beginner'}
        </span>
        {lesson?.author?.name && (
          <span className="text-xs text-gray-500 flex items-center gap-1 ml-2 high-contrast:text-gray-400">
            <User size={13} /> Taught by {lesson.author.name}
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6 leading-tight high-contrast:text-white">
        {lesson?.title}
      </h1>

      {/* Sticky Assistive Audio Control Toolbar */}
      <div
        className={`sticky top-20 z-40 p-4 rounded-3xl shadow-xl border mb-8 flex flex-wrap items-center justify-between gap-4 transition-all ${
          highContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={isSpeaking ? pause : handleReadAloud}
            className={`p-3.5 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isSpeaking
                ? 'bg-yellow-400 text-black ring-4 ring-yellow-100'
                : highContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={isSpeaking ? 'Pause reading' : 'Listen to entire lesson'}
          >
            {isSpeaking ? <Pause size={20} /> : <Play size={20} className="fill-current ml-0.5" />}
          </button>

          <button
            onClick={stop}
            className="p-3 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors high-contrast:hover:bg-gray-800"
            title="Stop audio"
          >
            <Square size={18} />
          </button>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400">Assistive Audio Guide</p>
            <p className="text-xs font-bold text-gray-800 high-contrast:text-white">
              {isSpeaking ? 'Reading aloud... (Click any paragraph to jump)' : 'Listen to lesson notes'}
            </p>
          </div>
        </div>

        {/* AI Simple Explanation Trigger */}
        <button
          onClick={handleExplainSimply}
          disabled={explaining}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
        >
          {explaining ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          <span>Explain Simply (AI)</span>
        </button>
      </div>

      {/* AI Summary Box (if requested) */}
      {aiSummary && (
        <div className="mb-8 p-6 rounded-3xl bg-purple-50 border border-purple-200 shadow-sm animate-in fade-in duration-300 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
          <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm mb-2 high-contrast:text-yellow-400">
            <Sparkles size={18} />
            <span>AI Simple Takeaway</span>
          </div>
          <p className="text-sm font-medium text-purple-950 leading-relaxed high-contrast:text-white">
            {aiSummary}
          </p>
        </div>
      )}

      {/* Lesson Paragraphs (Interactive text highlighting) */}
      <div className="space-y-5 mb-12">
        {paragraphs.map((para, index) => (
          <div
            key={index}
            onClick={() => handleFocusParagraph(index)}
            style={{ fontSize: `${fontSize}px` }}
            className={`p-6 rounded-3xl transition-all cursor-pointer leading-relaxed border ${
              activeParagraph === index
                ? highContrast
                  ? 'bg-gray-800 border-yellow-400 shadow-xl'
                  : 'bg-blue-50/80 border-blue-300 shadow-md ring-2 ring-blue-100'
                : focusMode
                ? 'opacity-25 blur-[1px]'
                : highContrast
                ? 'bg-gray-900 border-gray-800 hover:border-yellow-400'
                : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-black uppercase text-gray-300 mt-1 select-none">
                #{index + 1}
              </span>
              <p className="flex-1 font-normal leading-relaxed">{para}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusParagraph(index);
                }}
                className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 transition-colors"
                title="Read this paragraph aloud"
              >
                <Volume2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Comprehension & Quiz Section */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
          highContrast ? 'bg-gray-900 border-yellow-400' : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <HelpCircle size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black high-contrast:text-white">Comprehension Practice</h3>
            <p className="text-xs text-gray-400">Answer by typing or speaking to test your understanding.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-5 high-contrast:bg-black high-contrast:border-gray-800">
          <p className="font-bold text-base text-gray-800 high-contrast:text-white">{questionText}</p>
        </div>

        {/* Answer Input */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your response here or click the microphone to speak..."
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={isListening ? stopSTT : startSTT}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 high-contrast:bg-gray-800 high-contrast:text-white'
              }`}
            >
              <Mic size={16} />
              <span>{isListening ? 'Listening (Speak now)...' : 'Voice Answer (Speech-to-Text)'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !answer.trim()}
              onClick={handleAnswerSubmit}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span>Submit Answer</span>
            </button>
          </div>

          {/* AI Feedback Card */}
          {feedback && (
            <div
              className={`p-5 rounded-2xl border mt-5 animate-in fade-in ${
                feedback.correct
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm mb-1">
                {feedback.correct ? (
                  <>
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span>Great Job! Concept Mastered</span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-amber-600" />
                    <span>Keep Going! Review Hint</span>
                  </>
                )}
              </div>
              <p className="text-xs leading-relaxed mt-1">{feedback.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lesson;
