import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play, Clock, Star, CheckCircle2, BookOpen, Trophy, TrendingUp, Loader2,
  Video, Youtube, Upload, Search, Filter, ClipboardList, Bot, Sparkles,
  ArrowRight, User, Send, Mic, Volume2, X, AlertCircle, CheckCircle,
  HelpCircle, GraduationCap, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useToast } from '../context/ToastContext';
import API_BASE from '../utils/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractYouTubeId(url = '') {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function getEmbedUrl(lecture) {
  if (!lecture) return null;
  if (lecture.type === 'youtube') {
    const id = extractYouTubeId(lecture.youtubeUrl);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  }
  if (!lecture.videoPath) return null;
  if (lecture.videoPath.startsWith('http://') || lecture.videoPath.startsWith('https://')) {
    return lecture.videoPath;
  }
  return `${API_BASE}${lecture.videoPath}`;
}

const diffColor = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-purple-100 text-purple-700',
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`flex items-center gap-4 p-5 rounded-3xl border ${color} shadow-sm transition-all hover:shadow-md`}>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/70 shadow-sm flex-shrink-0">
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black leading-none truncate">{value}</p>
      <p className="text-xs font-bold mt-1 opacity-80 truncate">{label}</p>
      {sub && <p className="text-[10px] opacity-65 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const ProgressBar = ({ percent }) => (
  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { highContrast, disabilityType } = useAccessibility();
  const { showToast } = useToast();

  // Active Tab: 'lessons' | 'videos' | 'tasks' | 'ai'
  const initialTab = searchParams.get('tab') || 'lessons';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [lessons, setLessons] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Video preview player modal
  const [previewLecture, setPreviewLecture] = useState(null);

  // Inline AI Assistant Question box
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const authHeader = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user?.token}`,
    };
  }, [user?.token]);

  // Sync tab with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSearchQuery('');
  };

  // Fetch all student data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [lessonsRes, progressRes, lecturesRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/api/lessons`, { headers: authHeader() }),
        fetch(`${API_BASE}/api/progress/me`, { headers: authHeader() }),
        fetch(`${API_BASE}/api/lectures`, { headers: authHeader() }),
        fetch(`${API_BASE}/api/progress/my-tasks`, { headers: authHeader() }),
      ]);

      const fetchedLessons = lessonsRes.ok ? await lessonsRes.json() : [];
      const fetchedProgress = progressRes.ok ? await progressRes.json() : null;
      const fetchedLectures = lecturesRes.ok ? await lecturesRes.json() : [];
      const fetchedTasks = tasksRes.ok ? await tasksRes.json() : [];

      setLessons(fetchedLessons);
      setProgress(fetchedProgress);
      setLectures(fetchedLectures);
      setTasks(fetchedTasks);
    } catch (err) {
      setError('Could not reach server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map lesson completion progress
  const progressMap = {};
  progress?.records?.forEach((r) => {
    if (r.lessonId?._id) progressMap[r.lessonId._id] = r;
  });

  // Filter lessons
  const lessonCategories = Array.from(new Set(lessons.map((l) => l.category).filter(Boolean)));
  const filteredLessons = lessons.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesCat = categoryFilter === 'all' || l.category === categoryFilter;
    const matchesDiff = difficultyFilter === 'all' || l.difficulty === difficultyFilter;
    const matchesSearch =
      l.title.toLowerCase().includes(q) ||
      (l.content || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q);
    return matchesCat && matchesDiff && matchesSearch;
  });

  // Filter lectures
  const filteredLectures = lectures.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.teacher?.name || '').toLowerCase().includes(q)
    );
  });

  // Quick AI Study Assistant handler
  const handleAskAI = async (customPrompt = null) => {
    const query = customPrompt || aiQuestion;
    if (!query.trim()) {
      showToast('Please type a study question', 'info');
      return;
    }

    setAiLoading(true);
    setAiAnswer('');

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ message: query.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiAnswer(data.reply || data.response || 'Here is your learning summary!');
      } else {
        showToast(data.message || 'AI assistant is currently busy', 'error');
      }
    } catch (err) {
      showToast('Failed to reach AI service', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`space-y-8 pt-4 pb-16 font-inter ${highContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                Student Learning Portal
              </span>
              {disabilityType && disabilityType !== 'none' && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black">
                  {disabilityType} Mode Active
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mt-2 text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Learner'} 👋
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Access study notes, watch video lessons, review assigned teacher tasks, and ask your AI study companion anytime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabChange('ai')}
              className="flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-2xl font-black text-xs shadow-lg hover:bg-blue-50 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              <span>Ask AI Buddy</span>
            </button>
            <button
              onClick={() => navigate('/talk-to-ai')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-3 rounded-2xl font-black text-xs border border-white/20 backdrop-blur-md transition-all active:scale-95"
            >
              <Bot size={16} />
              <span>Full AI Voice Chat</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* ── Key Metrics Cards ── */}
      {progress && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Lessons Available"
              value={lessons.length}
              sub={`${progress.completedLessons || 0} completed`}
              color="bg-blue-50 border-blue-100 text-blue-700"
            />
            <StatCard
              icon={CheckCircle2}
              label="Learning Progress"
              value={`${progress.progressPercent || 0}%`}
              sub="total curriculum goal"
              color="bg-green-50 border-green-100 text-green-700"
            />
            <StatCard
              icon={Clock}
              label="Time Invested"
              value={`${progress.totalTimeSpent || 0}m`}
              sub="active learning minutes"
              color="bg-amber-50 border-amber-100 text-amber-700"
            />
            <StatCard
              icon={ClipboardList}
              label="Assigned Tasks"
              value={tasks.length}
              sub={`${tasks.filter((t) => t.status === 'completed').length} completed`}
              color="bg-purple-50 border-purple-100 text-purple-700"
            />
          </div>

          {/* Overall Progress Bar */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600 high-contrast:text-yellow-400" />
                <span className="font-extrabold text-gray-800 text-sm high-contrast:text-white">
                  Course Completion Progress
                </span>
              </div>
              <span className="text-sm font-black text-indigo-600 high-contrast:text-yellow-400">
                {progress.progressPercent || 0}%
              </span>
            </div>
            <ProgressBar percent={progress.progressPercent || 0} />
            <p className="text-xs text-gray-400 mt-2">
              {progress.completedLessons || 0} of {lessons.length} total lessons finished
            </p>
          </div>
        </div>
      )}

      {/* ── Student Portal Navigation Tabs ── */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto high-contrast:bg-gray-900 high-contrast:border-gray-800">
        {[
          { id: 'lessons', label: 'Study Notes & Lessons', icon: BookOpen, count: lessons.length },
          { id: 'videos', label: 'Video Lectures', icon: Video, count: lectures.length },
          { id: 'tasks', label: 'Teacher Tasks & Homework', icon: ClipboardList, count: tasks.length },
          { id: 'ai', label: 'AI Study Assistant', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'text-gray-600 hover:bg-gray-50 high-contrast:text-white high-contrast:hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white high-contrast:bg-black high-contrast:text-yellow-400'
                      : 'bg-gray-100 text-gray-600 high-contrast:bg-gray-800 high-contrast:text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls (for lessons & videos) ── */}
      {(activeTab === 'lessons' || activeTab === 'videos') && (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 high-contrast:bg-gray-900 high-contrast:border-gray-800">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'lessons' ? 'lessons, study notes, topics...' : 'video lectures...'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xs high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
            />
          </div>

          {activeTab === 'lessons' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {lessonCategories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gray-50 border-0 outline-none high-contrast:bg-gray-800 high-contrast:text-white"
                >
                  <option value="all">All Subjects</option>
                  {lessonCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gray-50 border-0 outline-none high-contrast:bg-gray-800 high-contrast:text-white"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: STUDY NOTES & LESSONS ── */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-24 text-center bg-white rounded-3xl border border-gray-100">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
              <p className="text-gray-500 mt-3 text-xs font-medium">Loading your lessons...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
              <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-base font-bold text-gray-800 high-contrast:text-white">No lessons match your search</h3>
              <p className="text-xs text-gray-400 mt-1">Try clearing filters or search terms.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => {
                const prog = progressMap[lesson._id];
                const isDone = prog?.isCompleted;

                return (
                  <div
                    key={lesson._id}
                    onClick={() => navigate(`/lesson/${lesson._id}`)}
                    className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden high-contrast:bg-gray-900 high-contrast:border-yellow-400"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 high-contrast:bg-gray-800 high-contrast:text-yellow-400">
                          {lesson.category || 'General'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            diffColor[lesson.difficulty] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {lesson.difficulty || 'Beginner'}
                        </span>
                      </div>

                      {/* Title & snippet */}
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-snug high-contrast:text-white">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed high-contrast:text-gray-400">
                        {lesson.content || 'Interactive study notes with text-to-speech audio support.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 high-contrast:border-gray-800">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        {lesson.author?.name ? (
                          <span className="flex items-center gap-1 font-semibold text-gray-600 high-contrast:text-gray-300">
                            <User size={12} /> {lesson.author.name}
                          </span>
                        ) : (
                          <span>Academic Notes</span>
                        )}
                        {isDone ? (
                          <span className="flex items-center gap-1 font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Not completed</span>
                        )}
                      </div>

                      <button className="w-full py-3 bg-gray-50 rounded-2xl text-blue-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2 high-contrast:bg-gray-800 high-contrast:text-yellow-400">
                        <span>{isDone ? 'Review Lesson' : 'Read Notes & Practice'}</span>
                        <Play size={14} className="fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: VIDEO LECTURES ── */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-24 text-center bg-white rounded-3xl border border-gray-100">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
              <p className="text-gray-500 mt-3 text-xs font-medium">Loading video lectures...</p>
            </div>
          ) : filteredLectures.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
              <Video size={48} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-base font-bold text-gray-800 high-contrast:text-white">No video lectures available</h3>
              <p className="text-xs text-gray-400 mt-1">Check back soon as your teachers upload video materials.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLectures.map((lecture) => (
                <div
                  key={lecture._id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400 group"
                >
                  <div className="relative aspect-video bg-gray-900 overflow-hidden flex items-center justify-center">
                    {lecture.thumbnailUrl ? (
                      <img
                        src={lecture.thumbnailUrl}
                        alt={lecture.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Video size={40} className="text-gray-700" />
                    )}
                    <button
                      onClick={() => setPreviewLecture(lecture)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center transition-all transform hover:scale-110 backdrop-blur-sm"
                      aria-label="Play video"
                    >
                      <Play size={18} className="fill-current ml-0.5" />
                    </button>
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-md ${
                        lecture.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {lecture.type === 'youtube' ? <Youtube size={11} /> : <Upload size={11} />}
                      {lecture.type === 'youtube' ? 'YouTube' : 'Video'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => setPreviewLecture(lecture)}
                        className="font-bold text-gray-900 text-base leading-snug hover:text-blue-600 transition-colors cursor-pointer high-contrast:text-white"
                      >
                        {lecture.title}
                      </h3>
                      {lecture.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed high-contrast:text-gray-400">
                          {lecture.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between high-contrast:border-gray-800">
                      <span className="text-xs text-gray-400">
                        {lecture.teacher?.name || 'Instructor'}
                      </span>
                      <button
                        onClick={() => setPreviewLecture(lecture)}
                        className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                      >
                        <span>Watch Video</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TEACHER TASKS & HOMEWORK ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-24 text-center bg-white rounded-3xl border border-gray-100">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
              <p className="text-gray-500 mt-3 text-xs font-medium">Loading your homework tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <h3 className="text-base font-bold text-gray-800 high-contrast:text-white">All caught up!</h3>
              <p className="text-xs text-gray-400 mt-1">You have no pending assignments or teacher tasks.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700">
                        {task.lesson?.category || 'Task'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {task.status || 'Assigned'}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-gray-900 high-contrast:text-white leading-snug">
                      {task.title}
                    </h3>

                    {task.note && (
                      <div className="p-3 bg-gray-50 rounded-2xl my-3 text-xs text-gray-600 border border-gray-100 high-contrast:bg-black high-contrast:border-gray-800 high-contrast:text-gray-300">
                        <span className="font-bold block text-gray-400 uppercase text-[9px] mb-0.5">Teacher Note:</span>
                        {task.note}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between high-contrast:border-gray-800">
                    <div className="text-xs text-gray-400">
                      <span className="font-bold text-gray-700 high-contrast:text-gray-300 block">
                        Assigned by {task.teacher?.name || 'Teacher'}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-amber-600 font-semibold block">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {task.lesson?._id && (
                      <button
                        onClick={() => navigate(`/lesson/${task.lesson._id}`)}
                        className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <span>Open Lesson</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: ASK AI STUDY ASSISTANT ── */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm high-contrast:bg-gray-900 high-contrast:border-yellow-400 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 high-contrast:text-white">AI Study Companion</h2>
              <p className="text-xs text-gray-500">
                Ask any question about your lessons, concepts, or homework in Hindi or English.
              </p>
            </div>
          </div>

          {/* Quick Click Prompts */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Explain how photosynthesis works in 2 sentences',
                'What is the formula for linear equations?',
                'Give me a simple tip to remember scientific terms',
                'Summarize the laws of motion simply',
              ].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setAiQuestion(prompt);
                    handleAskAI(prompt);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-gray-100 transition-all text-left high-contrast:bg-black high-contrast:text-white high-contrast:border-gray-800"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask anything about your studies..."
                className="w-full p-4 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-xs transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/talk-to-ai')}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Bot size={15} /> Switch to Full Voice Dialogue
              </button>

              <button
                type="button"
                disabled={aiLoading || !aiQuestion.trim()}
                onClick={() => handleAskAI()}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Ask Question</span>
              </button>
            </div>
          </div>

          {/* Answer Display */}
          {aiAnswer && (
            <div className="p-6 rounded-3xl bg-indigo-50/60 border border-indigo-100 shadow-sm animate-in fade-in high-contrast:bg-black high-contrast:border-yellow-400">
              <div className="flex items-center gap-2 font-black text-xs text-indigo-700 uppercase tracking-wider mb-2 high-contrast:text-yellow-400">
                <Sparkles size={16} />
                <span>AI Tutor Response</span>
              </div>
              <p className="text-sm text-gray-800 font-medium leading-relaxed high-contrast:text-white">
                {aiAnswer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Interactive Video Player Modal ── */}
      {previewLecture && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewLecture(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewLecture(null)}
              className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors"
            >
              <X size={22} />
            </button>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {previewLecture.type === 'youtube' ? (
                <iframe
                  src={getEmbedUrl(previewLecture)}
                  title={previewLecture.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={getEmbedUrl(previewLecture)}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>

            <div className="p-6 bg-gray-950">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    previewLecture.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {previewLecture.type === 'youtube' ? 'YouTube' : 'Video'}
                </span>
                <span className="text-xs text-gray-400">
                  By {previewLecture.teacher?.name || 'Instructor'} ·{' '}
                  {new Date(previewLecture.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{previewLecture.title}</h2>
              {previewLecture.description && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{previewLecture.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
