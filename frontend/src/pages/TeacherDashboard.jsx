import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { Users, BookOpen, ClipboardList, Activity, UserPlus } from 'lucide-react';
import API_BASE from '../utils/api';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading]   = useState(true);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons]   = useState([]);
  const [tasks, setTasks]       = useState([]);

  const authHeader = () => {
    const u = JSON.parse(localStorage.getItem('user'));
    return { Authorization: `Bearer ${u?.token}` };
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, lRes, tRes] = await Promise.all([
          fetch(`${API_BASE}/api/teacher/students`, { headers: authHeader() }),
          fetch(`${API_BASE}/api/lessons`,           { headers: authHeader() }),
          fetch(`${API_BASE}/api/teacher/tasks`,     { headers: authHeader() }),
        ]);
        const [sData, lData, tData] = await Promise.all([sRes.json(), lRes.json(), tRes.json()]);
        if (sRes.ok) setStudents(sData);
        if (lRes.ok) setLessons(lData);
        if (tRes.ok) setTasks(tData);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = [
    { icon: Users,         title: 'My Students',      value: loading ? '...' : students.length, color: 'blue'   },
    { icon: BookOpen,      title: 'Active Lessons',    value: loading ? '...' : lessons.length,  color: 'purple' },
    { icon: ClipboardList, title: 'Tasks Assigned',    value: loading ? '...' : tasks.length,    color: 'orange' },
    { icon: Activity,      title: 'Pending Reviews',   value: loading ? '...' : '—',             color: 'green'  },
  ];

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="flex bg-gray-50 min-h-screen high-contrast:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8 overflow-y-auto">

          {}
          <header className="mb-6 mt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">
              Welcome back, {user?.name || 'Teacher'} 👋
            </h1>
            <p className="text-gray-500 high-contrast:text-gray-300">Here's what's happening in your classroom today.</p>
          </header>

          {}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                <div className={`p-3 rounded-xl w-fit mb-3 sm:mb-4 ${
                  stat.color === 'blue'   ? 'bg-blue-100 text-blue-600'     :
                  stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  stat.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                } high-contrast:bg-yellow-400 high-contrast:text-black`}>
                  <stat.icon size={22} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 high-contrast:text-white">{stat.value}</h3>
                <p className="text-gray-500 font-medium text-sm high-contrast:text-gray-400">{stat.title}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

            {}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 high-contrast:bg-gray-900 high-contrast:border-gray-800">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 high-contrast:text-white">My Students</h2>
                <button
                  onClick={() => navigate('/manage-students')}
                  className="text-sm text-blue-600 font-semibold hover:underline high-contrast:text-yellow-400"
                >
                  Manage →
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400">
                    <Users size={28} />
                  </div>
                  <p className="text-gray-500 mb-3 high-contrast:text-gray-400">No students added yet.</p>
                  <button
                    onClick={() => navigate('/manage-students')}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold transition-all high-contrast:bg-yellow-400 high-contrast:text-black"
                  >
                    + Add Students
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.slice(0, 6).map((s) => (
                    <div key={s._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-none high-contrast:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 high-contrast:text-white text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400 high-contrast:text-gray-500">{s.email}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize high-contrast:bg-gray-800 high-contrast:text-gray-300">
                        {s.disabilityType || 'none'}
                      </span>
                    </div>
                  ))}
                  {students.length > 6 && (
                    <p className="text-xs text-center text-gray-400 pt-2">+{students.length - 6} more students</p>
                  )}
                </div>
              )}
            </div>

            {}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 mb-4 high-contrast:text-white">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/create-lesson')}
                    className="w-full py-3 px-4 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors text-left flex items-center gap-3 high-contrast:bg-yellow-400 high-contrast:text-black"
                  >
                    <BookOpen size={20} /> Create New Lesson
                  </button>
                  <button
                    onClick={() => navigate('/manage-students')}
                    className="w-full py-3 px-4 bg-purple-50 text-purple-600 rounded-xl font-medium hover:bg-purple-100 transition-colors text-left flex items-center gap-3 high-contrast:bg-gray-700 high-contrast:text-white"
                  >
                    <UserPlus size={20} /> Add Students
                  </button>
                  <button
                    onClick={() => navigate('/manage-students')}
                    className="w-full py-3 px-4 bg-orange-50 text-orange-600 rounded-xl font-medium hover:bg-orange-100 transition-colors text-left flex items-center gap-3 high-contrast:bg-gray-700 high-contrast:text-white"
                  >
                    <ClipboardList size={20} /> Assign Task
                  </button>
                </div>
              </div>

              {}
              {tasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 high-contrast:text-white">Recent Tasks</h2>
                  <div className="space-y-3">
                    {recentTasks.map((t) => (
                      <div key={t._id} className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-none high-contrast:border-gray-800">
                        <p className="text-sm font-semibold text-gray-900 high-contrast:text-white">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.lesson?.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.students?.slice(0, 3).map((s) => (
                            <span key={s._id} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                              {s.name}
                            </span>
                          ))}
                          {(t.students?.length || 0) > 3 && (
                            <span className="text-xs text-gray-400">+{t.students.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;
