import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import API_BASE from '../utils/api';

const emptyQuestion = () => ({
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  voiceAnswerEnabled: false,
});

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(`${API_BASE}/api/lessons`, {
          headers: { Authorization: `Bearer ${storedUser?.token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setLessons(data);
          if (data.length > 0) setLessonId(data[0]._id);
        }
      } catch (err) {
        console.error('Could not fetch lessons');
      }
    };
    fetchLessons();
  }, []);

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedUser?.token}`,
        },
        body: JSON.stringify({ title, lesson: lessonId, questions }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/manage-lessons');
      } else {
        setError(data.message || 'Failed to create quiz');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen high-contrast:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8 overflow-y-auto">
             <button 
                onClick={() => navigate('/manage-lessons')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 mt-6 transition-colors high-contrast:text-gray-400 high-contrast:hover:text-yellow-400"
            >
                <ArrowLeft size={20} /> Back to Lessons
            </button>

            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">Create Quiz</h1>
                    <p className="text-gray-500 high-contrast:text-gray-300">Add assessment questions to your lesson.</p>
                </header>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 high-contrast:bg-gray-900 high-contrast:border-gray-800 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Quiz Title</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                placeholder="e.g. Chapter 1 Quiz"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Associated Lesson</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                value={lessonId}
                                onChange={(e) => setLessonId(e.target.value)}
                            >
                                {lessons.length === 0 && (
                                    <option value="">No lessons found — create a lesson first</option>
                                )}
                                {lessons.map((lesson) => (
                                    <option key={lesson._id} value={lesson._id}>{lesson.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold text-gray-900 high-contrast:text-white">Question {qIndex + 1}</h3>
                                <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 high-contrast:text-red-400">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Question Text</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                    value={q.questionText}
                                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                    placeholder="e.g., What is the capital of France?"
                                />
                            </div>

                            <div className="space-y-4 mb-6">
                                <label className="block text-sm font-medium text-gray-700 high-contrast:text-white">Options <span className="text-gray-400 font-normal">(select the correct answer)</span></label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex gap-3 items-center">
                                        <input 
                                            type="text"
                                            required
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                            value={opt}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                        />
                                        <input 
                                            type="radio" 
                                            name={`correct-${qIndex}`}
                                            checked={q.correctAnswer === opt && opt !== ''}
                                            onChange={() => updateQuestion(qIndex, 'correctAnswer', opt)}
                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                            title="Mark as correct answer"
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={() => addOption(qIndex)} className="text-sm text-blue-600 font-medium hover:underline high-contrast:text-yellow-400">+ Add Option</button>
                            </div>

                            <div className="flex items-center gap-3 border-t border-gray-100 pt-4 high-contrast:border-gray-800">
                                <input 
                                    type="checkbox"
                                    id={`voice-${qIndex}`}
                                    checked={q.voiceAnswerEnabled}
                                    onChange={(e) => updateQuestion(qIndex, 'voiceAnswerEnabled', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor={`voice-${qIndex}`} className="text-sm text-gray-700 high-contrast:text-white">Enable Voice Answer for this question</label>
                            </div>
                        </div>
                    ))}

                    <button 
                        type="button" 
                        onClick={addQuestion}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 high-contrast:border-gray-700 high-contrast:text-gray-400 high-contrast:hover:border-yellow-400 high-contrast:hover:text-yellow-400"
                    >
                        <Plus size={24} /> Add Question
                    </button>

                    <div className="flex justify-end pt-4">
                         <button 
                            type="submit"
                            disabled={loading || lessons.length === 0}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 rounded-xl font-bold transition-all shadow-lg high-contrast:bg-yellow-400 high-contrast:text-black disabled:opacity-50"
                        >
                            <Save size={20} /> {loading ? 'Saving...' : 'Save Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
      </div>
    </div>
  );
};

export default CreateQuiz;
