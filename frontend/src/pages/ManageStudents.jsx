import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar';
import { UserPlus, Trash2, ClipboardList, X, CheckCircle, BookOpen, AlertCircle } from 'lucide-react';
import API_BASE from '../utils/api';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [students, setStudents]       = useState([]);
  const [lessons, setLessons]         = useState([]);
  const [tasks, setTasks]             = useState([]);
  const [email, setEmail]             = useState('');
  const [addError, setAddError]       = useState('');
  const [addSuccess, setAddSuccess]   = useState('');
  const [addLoading, setAddLoading]   = useState(false);

  const [showModal, setShowModal]       = useState(false);
  const [taskForm, setTaskForm]         = useState({ title: '', lessonId: '', studentIds: [], dueDate: '', note: '' });
  const [taskError, setTaskError]       = useState('');
  const [taskLoading, setTaskLoading]   = useState(false);
  const [taskSuccess, setTaskSuccess]   = useState('');

  const authHeader = () => {
    const u = JSON.parse(localStorage.getItem('user'));
    return { Authorization: `Bearer ${u?.token}`, 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetchStudents();
    fetchLessons();
    fetchTasks();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/students`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchLessons = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/lessons`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setLessons(data);
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teacher/tasks`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (e) { console.error(e); }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddError(''); setAddSuccess(''); setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/teacher/students`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents([...students, data]);
        setEmail('');
        setAddSuccess(`${data.name} added to your classroom!`);
        setTimeout(() => setAddSuccess(''), 4000);
      } else {
        setAddError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (e) { setAddError('Could not connect to server. Check your connection and try again.'); }
    finally { setAddLoading(false); }
  };

  const handleRemoveStudent = async (id) => {
    if (!window.confirm('Remove this student from your classroom?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/teacher/students/${id}`, { method: 'DELETE', headers: authHeader() });
      if (res.ok) setStudents(students.filter((s) => s._id !== id));
    } catch (e) { alert('Could not connect to server'); }
  };

  const openModal = () => {
    setTaskForm({ title: '', lessonId: lessons[0]?._id || '', studentIds: [], dueDate: '', note: '' });
    setTaskError(''); setTaskSuccess('');
    setShowModal(true);
  };

  const toggleStudent = (id) => {
    setTaskForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  };

  const selectAllStudents = () => {
    setTaskForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.length === students.length ? [] : students.map((s) => s._id),
    }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (taskForm.studentIds.length === 0) { setTaskError('Select at least one student.'); return; }
    if (!taskForm.lessonId) { setTaskError('Please create a lesson first.'); return; }
    setTaskLoading(true); setTaskError('');
    try {
      const res = await fetch(`${API_BASE}/api/teacher/tasks`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          title: taskForm.title,
          lessonId: taskForm.lessonId,
          studentIds: taskForm.studentIds,
          dueDate: taskForm.dueDate || undefined,
          note: taskForm.note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks([data, ...tasks]);
        setTaskSuccess('Task assigned successfully!');
        setTimeout(() => { setShowModal(false); setTaskSuccess(''); }, 1500);
      } else {
        setTaskError(data.message);
      }
    } catch (e) { setTaskError('Could not connect to server'); }
    finally { setTaskLoading(false); }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen high-contrast:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <DashboardNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 pt-16 md:pt-20 px-4 sm:px-6 lg:px-8 pb-8 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 mt-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 high-contrast:text-yellow-400">My Students</h1>
              <p className="text-gray-500 high-contrast:text-gray-300">Add students by email and assign them tasks.</p>
            </div>
            <button
              onClick={openModal}
              disabled={students.length === 0 || lessons.length === 0}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-40 high-contrast:bg-yellow-400 high-contrast:text-black w-full sm:w-auto"
              title={students.length === 0 ? 'Add at least one student first' : lessons.length === 0 ? 'Create a lesson first' : ''}
            >
              <ClipboardList size={20} /> Assign Task
            </button>
          </div>

          {/* Add student form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 high-contrast:bg-gray-900 high-contrast:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 mb-4 high-contrast:text-white">Add Student by Email</h2>
            <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAddError(''); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
              />
              <button
                type="submit"
                disabled={addLoading}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                <UserPlus size={20} /> {addLoading ? 'Adding...' : 'Add Student'}
              </button>
            </form>

            {/* Error alert */}
            {addError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{addError}</span>
              </div>
            )}
            {/* Success message */}
            {addSuccess && (
              <p className="mt-3 text-green-600 text-sm font-medium flex items-center gap-1">
                <CheckCircle size={16} /> {addSuccess}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-400 high-contrast:text-gray-500">
              Only emails of registered students will be accepted.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10 high-contrast:bg-gray-900 high-contrast:border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100 high-contrast:bg-gray-800 high-contrast:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Name</th>
                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Email</th>
                  <th className="text-left py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Accessibility Need</th>
                  <th className="text-right py-4 px-6 text-gray-500 font-medium high-contrast:text-gray-300">Remove</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-16 text-gray-400 high-contrast:text-gray-500">No students yet. Add one using their email above.</td></tr>
                ) : students.map((s) => (
                  <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-none high-contrast:border-gray-800 high-contrast:hover:bg-gray-800">
                    <td className="py-4 px-6 font-medium text-gray-900 high-contrast:text-white">{s.name}</td>
                    <td className="py-4 px-6 text-gray-500 high-contrast:text-gray-400">{s.email}</td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold capitalize high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                        {s.disabilityType || 'none'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => handleRemoveStudent(s._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors high-contrast:hover:bg-red-900">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden mb-10">
            {students.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 high-contrast:bg-gray-900 high-contrast:border-gray-800 high-contrast:text-gray-500">
                No students yet. Add one using their email above.
              </div>
            ) : students.map((s) => (
              <div key={s._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex justify-between items-center high-contrast:bg-gray-900 high-contrast:border-gray-800">
                <div>
                  <p className="font-semibold text-gray-900 high-contrast:text-white">{s.name}</p>
                  <p className="text-xs text-gray-400 high-contrast:text-gray-500">{s.email}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold capitalize high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                    {s.disabilityType || 'none'}
                  </span>
                </div>
                <button onClick={() => handleRemoveStudent(s._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Assigned tasks */}
          <h2 className="text-xl font-bold text-gray-900 mb-4 high-contrast:text-white">Assigned Tasks</h2>
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 high-contrast:bg-gray-900 high-contrast:border-gray-800 high-contrast:text-gray-500">
              No tasks assigned yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((t) => (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm high-contrast:bg-gray-900 high-contrast:border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 high-contrast:text-white">{t.title}</h3>
                      <p className="text-sm text-gray-500 high-contrast:text-gray-400 flex items-center gap-1 mt-1">
                        <BookOpen size={14}/> {t.lesson?.title || 'Lesson'}
                      </p>
                    </div>
                    {t.dueDate && (
                      <span className="text-xs text-gray-400 high-contrast:text-gray-500">
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {t.students?.map((s) => (
                      <span key={s._id} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full high-contrast:bg-gray-700 high-contrast:text-yellow-400">
                        {s.name}
                      </span>
                    ))}
                  </div>
                  {t.note && <p className="text-sm text-gray-500 mt-3 italic high-contrast:text-gray-400">"{t.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Assign Task modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto high-contrast:bg-gray-900 high-contrast:border high-contrast:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 high-contrast:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 high-contrast:text-white">Assign Task</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 high-contrast:text-gray-400"><X size={24}/></button>
            </div>

            <form onSubmit={handleAssignTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">Task Title</label>
                <input
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="e.g. Read Chapter 3"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">Lesson to Assign</label>
                {lessons.length === 0 ? (
                  <p className="text-sm text-red-500">No lessons found. <span className="underline cursor-pointer" onClick={() => { setShowModal(false); navigate('/create-lesson'); }}>Create one first →</span></p>
                ) : (
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                    value={taskForm.lessonId}
                    onChange={(e) => setTaskForm({ ...taskForm, lessonId: e.target.value })}
                  >
                    {lessons.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 high-contrast:text-white">Assign To</label>
                  <button type="button" onClick={selectAllStudents} className="text-xs text-purple-600 font-semibold hover:underline high-contrast:text-yellow-400">
                    {taskForm.studentIds.length === students.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3 high-contrast:border-gray-700">
                  {students.map((s) => (
                    <label key={s._id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskForm.studentIds.includes(s._id)}
                        onChange={() => toggleStudent(s._id)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-800 high-contrast:text-white">{s.name} <span className="text-gray-400">({s.email})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">Note <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Any instructions for the students..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  value={taskForm.note}
                  onChange={(e) => setTaskForm({ ...taskForm, note: e.target.value })}
                />
              </div>

              {taskError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{taskError}</span>
                </div>
              )}
              {taskSuccess && <p className="text-green-600 text-sm font-medium flex items-center gap-1"><CheckCircle size={16}/> {taskSuccess}</p>}

              <button
                type="submit"
                disabled={taskLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                {taskLoading ? 'Assigning...' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
