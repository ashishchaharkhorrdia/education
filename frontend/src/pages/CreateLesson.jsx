import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { Save, ArrowLeft } from 'lucide-react';
import API_BASE from '../utils/api';

const CreateLesson = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    difficulty: 'Beginner',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE}/api/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedUser?.token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/manage-lessons');
      } else {
        setError(data.message || 'Failed to create lesson');
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">Create New Lesson</h1>
                    <p className="text-gray-500 high-contrast:text-gray-300">Design an accessible learning experience.</p>
                </header>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 high-contrast:bg-gray-900 high-contrast:border-gray-800 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Lesson Title</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                            placeholder="e.g. Introduction to Astronomy"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Category</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                placeholder="e.g. Science"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Difficulty</label>
                            <select 
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Lesson Content</label>
                        <p className="text-xs text-gray-500 mb-2 high-contrast:text-gray-400">Use basic paragraphs. The AI will handle formatting for accessibility.</p>
                        <textarea 
                            required
                            rows="12"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                            placeholder="Write your lesson content here..."
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 high-contrast:border-gray-800">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-xl font-bold transition-all shadow-lg high-contrast:bg-yellow-400 high-contrast:text-black disabled:opacity-50"
                        >
                            <Save size={20} /> {loading ? 'Saving...' : 'Save Lesson'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
      </div>
    </div>
  );
};

export default CreateLesson;
