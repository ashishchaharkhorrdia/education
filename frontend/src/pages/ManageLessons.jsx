import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../utils/api';

const ManageLessons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(`${API_BASE}/api/lessons`, {
          headers: { Authorization: `Bearer ${storedUser?.token}` },
        });
        const data = await res.json();
        if (res.ok) setLessons(data);
        else setError(data.message || 'Failed to load lessons');
      } catch (err) {
        setError('Could not connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE}/api/lessons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${storedUser?.token}` },
      });
      if (res.ok) setLessons(lessons.filter((l) => l._id !== id));
      else alert('Failed to delete lesson');
    } catch (err) {
      alert('Could not connect to server');
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen high-contrast:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8 overflow-y-auto">
            {}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 mt-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">Manage Lessons</h1>
                    <p className="text-gray-500 high-contrast:text-gray-300">Create, edit, and organize your course content.</p>
                </div>
                <button 
                    onClick={() => navigate('/create-lesson')}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg high-contrast:bg-yellow-400 high-contrast:text-black w-full sm:w-auto"
                >
                    <Plus size={20} /> Create New Lesson
                </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 high-contrast:border-yellow-400"></div>
                </div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                    <BookIcon />
                    <h3 className="text-xl font-bold text-gray-900 mt-4 high-contrast:text-white">No lessons yet</h3>
                    <p className="text-gray-500 mt-2 high-contrast:text-gray-400">Click "Create New Lesson" to add your first lesson.</p>
                </div>
            ) : (
                <>
                  {}
                  <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden high-contrast:bg-gray-900 high-contrast:border-gray-800">
                      <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-100 high-contrast:bg-gray-800 high-contrast:border-gray-700">
                              <tr>
                                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Title</th>
                                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Category</th>
                                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Difficulty</th>
                                  <th className="text-right py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Actions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {lessons.map((lesson) => (
                                  <tr key={lesson._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-none high-contrast:border-gray-800 high-contrast:hover:bg-gray-800">
                                      <td className="py-4 px-6 font-medium text-gray-900 high-contrast:text-white">{lesson.title}</td>
                                      <td className="py-4 px-6 text-gray-600 high-contrast:text-gray-400">
                                          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                                              {lesson.category}
                                          </span>
                                      </td>
                                      <td className="py-4 px-6 text-gray-600 high-contrast:text-gray-400">{lesson.difficulty}</td>
                                      <td className="py-4 px-6 text-right space-x-2">
                                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors high-contrast:hover:bg-yellow-400 high-contrast:hover:text-black">
                                              <Eye size={18} />
                                          </button>
                                          <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors high-contrast:hover:bg-green-400 high-contrast:hover:text-black">
                                              <Edit size={18} />
                                          </button>
                                          <button 
                                              onClick={() => handleDelete(lesson._id)}
                                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors high-contrast:hover:bg-red-400 high-contrast:hover:text-black"
                                          >
                                              <Trash2 size={18} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {}
                  <div className="space-y-4 sm:hidden">
                      {lessons.map((lesson) => (
                          <div key={lesson._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm high-contrast:bg-gray-900 high-contrast:border-gray-800">
                              <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-gray-900 high-contrast:text-white flex-1 pr-2">{lesson.title}</h3>
                                  <div className="flex items-center gap-1">
                                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                          <Eye size={16} />
                                      </button>
                                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                          <Edit size={16} />
                                      </button>
                                      <button 
                                          onClick={() => handleDelete(lesson._id)}
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                                      {lesson.category}
                                  </span>
                                  <span className="text-xs text-gray-500 high-contrast:text-gray-400">{lesson.difficulty}</span>
                              </div>
                          </div>
                      ))}
                  </div>
                </>
            )}
        </main>
      </div>
    </div>
  );
};

const BookIcon = () => (
  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-400 high-contrast:bg-gray-800">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  </div>
);

export default ManageLessons;
