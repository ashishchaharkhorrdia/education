import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Bot, Mic, TrendingUp, Star, Clock,
  CheckCircle2, Flame, Trophy, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';


const ANNOUNCEMENTS = [
  { id: 1, icon: '📢', title: 'New Lesson Added', body: 'Introduction to Chemistry is now live!', time: '2h ago', color: 'bg-blue-50 border-blue-100' },
  { id: 2, icon: '🏆', title: 'Weekly Challenge', body: 'Complete 3 lessons this week and earn a badge!', time: '1d ago', color: 'bg-yellow-50 border-yellow-100' },
  { id: 3, icon: '🎯', title: 'Quiz Reminder', body: 'Biology Chapter 2 quiz closes tomorrow.', time: '2d ago', color: 'bg-purple-50 border-purple-100' },
];

const RECENT_ACTIVITIES = [
  { id: 1, type: 'lesson', title: 'Introduction to Biology', action: 'Completed', time: 'Yesterday', icon: CheckCircle2, color: 'text-green-500' },
  { id: 2, type: 'quiz', title: 'World History Quiz', action: 'Score: 85%', time: '2 days ago', icon: Trophy, color: 'text-purple-500' },
  { id: 3, type: 'lesson', title: 'Physics: Motion', action: 'Started', time: '3 days ago', icon: Zap, color: 'text-orange-500' },
  { id: 4, type: 'lesson', title: 'Mathematics Basics', action: 'In Progress', time: 'Last week', icon: TrendingUp, color: 'text-blue-500' },
];

const QUICK_FEATURES = [
  { label: 'Talk to AI', desc: 'Ask anything, learn faster', icon: Bot, to: '/talk-to-ai', gradient: 'from-indigo-500 to-purple-600' },
  { label: 'My Lessons', desc: 'Continue where you left off', icon: BookOpen, to: '/dashboard', gradient: 'from-blue-500 to-cyan-500' },
  { label: 'Voice Control', desc: 'Navigate hands-free', icon: Mic, to: '/dashboard', gradient: 'from-rose-500 to-pink-500' },
];

const STATS = [
  { label: 'Day Streak', value: '7', icon: Flame, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  { label: 'Completed', value: '12', icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  { label: 'Hours Learned', value: '4.5', icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { label: 'Best Score', value: '95%', icon: Star, bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
];


const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pt-4">

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon: Icon, bg, text, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-2xl p-4 flex items-center gap-3`}>
            <Icon size={22} className={text} />
            <div>
              <p className={`text-xl font-bold ${text}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Access</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {QUICK_FEATURES.map(({ label, desc, icon: Icon, to, gradient }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`group bg-gradient-to-br ${gradient} rounded-2xl p-5 text-left text-white shadow-lg hover:scale-[1.02] transition-all`}
            >
              <Icon size={28} className="mb-3 opacity-90" />
              <p className="font-bold text-base">{label}</p>
              <p className="text-xs opacity-80 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {RECENT_ACTIVITIES.map(({ id, title, action, time, icon: Icon, color }) => (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                  <p className="text-xs text-gray-400">{action} · {time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Announcements</h2>
          <div className="space-y-3">
            {ANNOUNCEMENTS.map(({ id, icon, title, body, time, color }) => (
              <div key={id} className={`${color} border rounded-2xl p-4`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{body}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
