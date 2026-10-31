import React, { useState, useEffect } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { MessageSquare, Check, X } from 'lucide-react';
import API_BASE from '../utils/api';

const SubmissionReview = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(`${API_BASE}/api/submissions`, {
          headers: { Authorization: `Bearer ${storedUser?.token}` },
        });
        const data = await res.json();
        if (res.ok) setSubmissions(data);
        else setError(data.message || 'Failed to load submissions');
      } catch (err) {
        setError('Could not connect to server');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleGrade = async (id, score) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE}/api/submissions/${id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedUser?.token}`,
        },
        body: JSON.stringify({ score }),
      });
      if (res.ok) {
        setSubmissions(submissions.filter((s) => s._id !== id));
      } else {
        alert('Failed to grade submission');
      }
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
            <header className="mb-6 mt-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">Review Submissions</h1>
                <p className="text-gray-500 high-contrast:text-gray-300">Provide feedback on student answers.</p>
            </header>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 high-contrast:border-yellow-400"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {submissions.map((sub) => (
                      <div key={sub._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden high-contrast:bg-gray-900 high-contrast:border-gray-800 flex flex-col">
                          <div className="p-6 border-b border-gray-50 high-contrast:border-gray-800">
                               <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-bold text-lg text-gray-900 high-contrast:text-white">
                                    {sub.student?.name || 'Student'}
                                  </h3>
                                  <span className="text-xs text-gray-400">
                                    {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : ''}
                                  </span>
                               </div>
                               <p className="text-sm text-gray-500 high-contrast:text-gray-400">
                                 {sub.quiz?.lesson?.title || 'Lesson'} - {sub.quiz?.title || 'Quiz'}
                               </p>
                          </div>
                          <div className="p-6 flex-1 bg-gray-50 high-contrast:bg-black">
                              <p className="text-sm font-semibold text-gray-500 uppercase mb-2 high-contrast:text-gray-400">Student Answer:</p>
                              <div className="bg-white p-4 rounded-xl border border-gray-100 text-gray-800 italic high-contrast:bg-gray-900 high-contrast:border-gray-700 high-contrast:text-gray-300">
                                  "{sub.answer || sub.answers?.join(', ')}"
                              </div>
                          </div>
                          <div className="p-4 bg-white border-t border-gray-100 flex gap-4 high-contrast:bg-gray-900 high-contrast:border-gray-800">
                              <button 
                                  onClick={() => handleGrade(sub._id, 100)}
                                  className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium flex justify-center items-center gap-2 high-contrast:bg-green-900 high-contrast:text-green-300"
                              >
                                  <Check size={18} /> Correct
                              </button>
                              <button 
                                  onClick={() => handleGrade(sub._id, 0)}
                                  className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex justify-center items-center gap-2 high-contrast:bg-red-900 high-contrast:text-red-300"
                              >
                                  <X size={18} /> Incorrect
                              </button>
                          </div>
                          <div className="px-4 pb-4 bg-white high-contrast:bg-gray-900">
                              <button className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium text-sm flex justify-center items-center gap-2 high-contrast:bg-gray-800 high-contrast:text-white">
                                  <MessageSquare size={16} /> Add Feedback
                              </button>
                          </div>
                      </div>
                  ))}

                  {submissions.length === 0 && (
                       <div className="col-span-full text-center py-20">
                           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 high-contrast:bg-green-900 high-contrast:text-green-300">
                               <Check size={32} />
                           </div>
                           <h3 className="text-xl font-bold text-gray-900 high-contrast:text-white">All caught up!</h3>
                           <p className="text-gray-500 high-contrast:text-gray-400">No pending submissions to review.</p>
                       </div>
                  )}
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default SubmissionReview;
