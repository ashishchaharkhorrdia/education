import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Search, Edit2, Trash2, X, Shield, User, Check,
  AlertCircle, Loader2, BookOpen, Calendar, ClipboardList, Video, Play,
  Youtube, Upload, FileText, Lock, Mail, Key, Plus, ChevronRight,
  GraduationCap, ArrowLeft, FolderOpen, ExternalLink, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

const AdminDashboard = () => {
  const { user: currentUser, updateUserSession } = useAuth();
  const { showToast } = useToast();

  // Navigation tabs: 'users' | 'videos' | 'lessons' | 'tasks' | 'profile'
  const [activeTab, setActiveTab] = useState('users');

  // Selected Teacher for Teacher-specific Content View
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherContent, setTeacherContent] = useState(null);
  const [teacherContentLoading, setTeacherContentLoading] = useState(false);
  const [teacherContentSubTab, setTeacherContentSubTab] = useState('videos'); // 'videos' | 'lessons' | 'tasks'

  // Global Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    teachersCount: 0,
    studentsCount: 0,
    lecturesCount: 0,
    lessonsCount: 0,
    tasksCount: 0,
  });

  // Data collections
  const [users, setUsers] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [tasks, setTasks] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [lessonCategoryFilter, setLessonCategoryFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all'); // for global videos/lessons view

  // ── Modals State ──
  // User Modal (Add / Edit)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    disabilityType: 'none',
  });
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Lecture Modal (Add Video)
  const [lectureModalOpen, setLectureModalOpen] = useState(false);
  const [lectureTab, setLectureTab] = useState('youtube'); // 'youtube' | 'upload'
  const [lectureFormData, setLectureFormData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    teacherId: '',
  });
  const [lectureFile, setLectureFile] = useState(null);
  const [lectureSubmitting, setLectureSubmitting] = useState(false);
  const [previewLecture, setPreviewLecture] = useState(null);

  // Lesson Modal (Add / Edit Text & Notes)
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    category: '',
    difficulty: 'Beginner',
    content: '',
    authorId: '',
  });
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  // Profile Form State
  const [profileFormData, setProfileFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Password Form State
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const authHeader = useCallback(() => ({
    'Authorization': `Bearer ${currentUser?.token}`,
  }), [currentUser?.token]);

  useEffect(() => {
    if (currentUser) {
      setProfileFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: authHeader() });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (_) {}
  }, [authHeader]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        showToast(data.message || 'Failed to fetch users', 'error');
      }
    } catch (err) {
      showToast('Server error while loading users', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, showToast]);

  const fetchLectures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/lectures`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setLectures(data);
      } else {
        showToast(data.message || 'Failed to fetch video lectures', 'error');
      }
    } catch (err) {
      showToast('Server error while loading lectures', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, showToast]);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/lessons`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setLessons(data);
      } else {
        showToast(data.message || 'Failed to fetch lessons', 'error');
      }
    } catch (err) {
      showToast('Server error while loading lessons', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, showToast]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/tasks`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      } else {
        showToast(data.message || 'Failed to fetch tasks', 'error');
      }
    } catch (err) {
      showToast('Server error while loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeader, showToast]);

  // Fetch all content belonging to a specific teacher
  const fetchTeacherContent = useCallback(async (teacherId) => {
    setTeacherContentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/teachers/${teacherId}/content`, {
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherContent(data);
      } else {
        showToast(data.message || 'Failed to load teacher content', 'error');
      }
    } catch (err) {
      showToast('Server error while loading teacher content', 'error');
    } finally {
      setTeacherContentLoading(false);
    }
  }, [authHeader, showToast]);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'videos') {
      fetchLectures();
      fetchUsers();
    } else if (activeTab === 'lessons') {
      fetchLessons();
      fetchUsers();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    }
    setSearchQuery('');
  }, [activeTab, fetchStats, fetchUsers, fetchLectures, fetchLessons, fetchTasks]);

  // Refresh teacher content when requested
  const refreshCurrentTeacher = useCallback(() => {
    if (selectedTeacher?._id) {
      fetchTeacherContent(selectedTeacher._id);
    }
  }, [selectedTeacher, fetchTeacherContent]);

  // Click on a teacher to inspect and manage their content
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setTeacherContentSubTab('videos');
    fetchTeacherContent(teacher._id);
  };

  const handleClearSelectedTeacher = () => {
    setSelectedTeacher(null);
    setTeacherContent(null);
    fetchUsers();
    fetchStats();
  };

  // ── User Management Handlers ────────────────────────────────────────────────
  const handleOpenUserModal = (user = null, defaultRole = 'student') => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'student',
        disabilityType: user.disabilityType || 'none',
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        disabilityType: 'none',
      });
    }
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    try {
      const url = editingUser
        ? `${API_BASE}/api/admin/users/${editingUser._id}`
        : `${API_BASE}/api/admin/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(userFormData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`User ${editingUser ? 'updated' : 'registered'} successfully`, 'success');
        handleCloseUserModal();
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Server error while saving user', 'error');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser?._id) {
      showToast('You cannot delete your own admin account', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User removed successfully', 'success');
        if (selectedTeacher?._id === id) {
          handleClearSelectedTeacher();
        } else {
          fetchUsers();
          fetchStats();
        }
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting user', 'error');
    }
  };

  // ── Video Lecture Handlers ──────────────────────────────────────────────────
  const handleOpenLectureModal = (presetTeacherId = null) => {
    setLectureFormData({
      title: '',
      description: '',
      youtubeUrl: '',
      teacherId: presetTeacherId || selectedTeacher?._id || '',
    });
    setLectureFile(null);
    setLectureTab('youtube');
    setLectureModalOpen(true);
  };

  const handleSaveLecture = async (e) => {
    e.preventDefault();
    if (!lectureFormData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    setLectureSubmitting(true);
    try {
      let res;
      const targetTeacher = lectureFormData.teacherId || selectedTeacher?._id;

      if (lectureTab === 'youtube') {
        if (!lectureFormData.youtubeUrl.trim()) {
          showToast('YouTube URL is required', 'error');
          setLectureSubmitting(false);
          return;
        }

        res = await fetch(`${API_BASE}/api/lectures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
          body: JSON.stringify({
            title: lectureFormData.title.trim(),
            description: lectureFormData.description.trim(),
            type: 'youtube',
            youtubeUrl: lectureFormData.youtubeUrl.trim(),
            teacher: targetTeacher || undefined,
          }),
        });
      } else {
        if (!lectureFile) {
          showToast('Please select a video file to upload', 'error');
          setLectureSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('title', lectureFormData.title.trim());
        formData.append('description', lectureFormData.description.trim());
        formData.append('type', 'upload');
        formData.append('video', lectureFile);
        if (targetTeacher) {
          formData.append('teacher', targetTeacher);
        }

        res = await fetch(`${API_BASE}/api/lectures`, {
          method: 'POST',
          headers: authHeader(),
          body: formData,
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast('Video lecture added successfully', 'success');
        setLectureModalOpen(false);
        fetchLectures();
        fetchStats();
        if (selectedTeacher) {
          refreshCurrentTeacher();
        }
      } else {
        showToast(data.message || 'Failed to upload lecture', 'error');
      }
    } catch (err) {
      showToast('Error uploading video lecture', 'error');
    } finally {
      setLectureSubmitting(false);
    }
  };

  const handleDeleteLecture = async (id, title) => {
    if (!window.confirm(`Delete video "${title}"? This will delete any uploaded file permanently.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/lectures/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Video deleted successfully', 'success');
        fetchLectures();
        fetchStats();
        if (selectedTeacher) {
          refreshCurrentTeacher();
        }
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting video', 'error');
    }
  };

  // ── Text & Notes (Lessons) Handlers ─────────────────────────────────────────
  const handleOpenLessonModal = (lesson = null, presetAuthorId = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title || '',
        category: lesson.category || '',
        difficulty: lesson.difficulty || 'Beginner',
        content: lesson.content || '',
        authorId: lesson.author?._id || '',
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        title: '',
        category: '',
        difficulty: 'Beginner',
        content: '',
        authorId: presetAuthorId || selectedTeacher?._id || '',
      });
    }
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonFormData.title.trim() || !lessonFormData.category.trim() || !lessonFormData.content.trim()) {
      showToast('Title, category, and notes content are required', 'error');
      return;
    }

    setLessonSubmitting(true);
    try {
      const url = editingLesson
        ? `${API_BASE}/api/admin/lessons/${editingLesson._id}`
        : `${API_BASE}/api/admin/lessons`;
      const method = editingLesson ? 'PUT' : 'POST';

      const payload = {
        title: lessonFormData.title.trim(),
        category: lessonFormData.category.trim(),
        difficulty: lessonFormData.difficulty,
        content: lessonFormData.content.trim(),
      };

      if (lessonFormData.authorId) {
        payload.author = lessonFormData.authorId;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Lesson / Notes ${editingLesson ? 'updated' : 'created'} successfully`, 'success');
        setLessonModalOpen(false);
        fetchLessons();
        fetchStats();
        if (selectedTeacher) {
          refreshCurrentTeacher();
        }
      } else {
        showToast(data.message || 'Failed to save lesson', 'error');
      }
    } catch (err) {
      showToast('Server error while saving lesson', 'error');
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (id, title) => {
    if (!window.confirm(`Delete lesson "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/lessons/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Lesson deleted successfully', 'success');
        fetchLessons();
        fetchStats();
        if (selectedTeacher) {
          refreshCurrentTeacher();
        }
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Server error while deleting lesson', 'error');
    }
  };

  // ── Profile & Password Handlers ─────────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileFormData.name.trim() || !profileFormData.email.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          name: profileFormData.name.trim(),
          email: profileFormData.email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        updateUserSession(data);
        showToast('Admin profile updated successfully', 'success');
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Server error while updating profile', 'error');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordFormData.newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        updateUserSession(data);
        showToast('Password changed successfully', 'success');
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      showToast('Server error while changing password', 'error');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // ── Filters & Search ────────────────────────────────────────────────────────
  const teachersList = users.filter((u) => u.role === 'teacher');

  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredLectures = lectures.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesTeacher = teacherFilter === 'all' || l.teacher?._id === teacherFilter;
    const matchesSearch =
      l.title.toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.teacher?.name || '').toLowerCase().includes(q);
    return matchesTeacher && matchesSearch;
  });

  const filteredLessons = lessons.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesCat = lessonCategoryFilter === 'all' || l.category === lessonCategoryFilter;
    const matchesTeacher = teacherFilter === 'all' || l.author?._id === teacherFilter;
    const matchesSearch =
      l.title.toLowerCase().includes(q) ||
      (l.content || '').toLowerCase().includes(q) ||
      (l.category || '').toLowerCase().includes(q) ||
      (l.author?.name || '').toLowerCase().includes(q);
    return matchesCat && matchesTeacher && matchesSearch;
  });

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const lessonCategories = Array.from(new Set(lessons.map((l) => l.category).filter(Boolean)));

  // ── Render Teacher Content Hub (when a teacher is clicked) ──────────────────
  const renderTeacherContentHub = () => {
    if (!selectedTeacher) return null;

    const teacherLectures = teacherContent?.lectures || [];
    const teacherLessons = teacherContent?.lessons || [];
    const teacherTasks = teacherContent?.tasks || [];

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb & Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleClearSelectedTeacher}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm transition-all hover:-translate-x-0.5 high-contrast:bg-gray-900 high-contrast:text-yellow-400"
          >
            <ArrowLeft size={16} /> Back to All Users & Teachers
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenLectureModal(selectedTeacher._id)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Youtube size={16} /> Add Video for this Teacher
            </button>
            <button
              onClick={() => handleOpenLessonModal(null, selectedTeacher._id)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md shadow-blue-200 transition-all active:scale-95 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <Plus size={16} /> Create Note for this Teacher
            </button>
          </div>
        </div>

        {/* Teacher Hero Profile Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white text-indigo-900 flex items-center justify-center font-black text-2xl shadow-lg shadow-black/20">
                {selectedTeacher.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Faculty Instructor
                  </span>
                  <span className="text-xs text-indigo-300">
                    Member since {new Date(selectedTeacher.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mt-1 text-white">{selectedTeacher.name}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">{selectedTeacher.email}</p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[100px]">
                <p className="text-xs text-indigo-200 uppercase font-black tracking-wider">Videos</p>
                <p className="text-2xl font-black text-white">{teacherLectures.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[100px]">
                <p className="text-xs text-indigo-200 uppercase font-black tracking-wider">Notes</p>
                <p className="text-2xl font-black text-white">{teacherLessons.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[100px]">
                <p className="text-xs text-indigo-200 uppercase font-black tracking-wider">Tasks</p>
                <p className="text-2xl font-black text-white">{teacherTasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto high-contrast:bg-gray-900 high-contrast:border-gray-800">
          <button
            onClick={() => setTeacherContentSubTab('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              teacherContentSubTab === 'videos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black'
                : 'text-gray-600 hover:bg-gray-50 high-contrast:text-white'
            }`}
          >
            <Video size={16} />
            <span>Teacher's Videos ({teacherLectures.length})</span>
          </button>
          <button
            onClick={() => setTeacherContentSubTab('lessons')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              teacherContentSubTab === 'lessons'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black'
                : 'text-gray-600 hover:bg-gray-50 high-contrast:text-white'
            }`}
          >
            <FileText size={16} />
            <span>Teacher's Text & Notes ({teacherLessons.length})</span>
          </button>
          <button
            onClick={() => setTeacherContentSubTab('tasks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              teacherContentSubTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black'
                : 'text-gray-600 hover:bg-gray-50 high-contrast:text-white'
            }`}
          >
            <ClipboardList size={16} />
            <span>Assigned Tasks ({teacherTasks.length})</span>
          </button>
        </div>

        {/* Content Body */}
        {teacherContentLoading ? (
          <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
            <p className="text-gray-500 mt-3 font-medium">Loading {selectedTeacher.name}'s content library...</p>
          </div>
        ) : (
          <>
            {/* 1. Teacher Videos Sub-Tab */}
            {teacherContentSubTab === 'videos' && (
              <div>
                {teacherLectures.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
                    <Video className="text-gray-300 mx-auto mb-3" size={44} />
                    <h3 className="text-base font-bold text-gray-800 high-contrast:text-white">
                      {selectedTeacher.name} hasn't uploaded any videos yet
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Upload an educational video or YouTube lesson on their behalf.</p>
                    <button
                      onClick={() => handleOpenLectureModal(selectedTeacher._id)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-all"
                    >
                      <Plus size={14} /> Add Video for {selectedTeacher.name}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherLectures.map((lecture) => (
                      <div
                        key={lecture._id}
                        className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400 group"
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
                            {lecture.type === 'youtube' ? 'YouTube' : 'Uploaded'}
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
                            <span className="text-[10px] text-gray-400">
                              {new Date(lecture.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setPreviewLecture(lecture)}
                                className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                              >
                                Watch <ChevronRight size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteLecture(lecture._id, lecture.title)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Video"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Teacher Lessons & Notes Sub-Tab */}
            {teacherContentSubTab === 'lessons' && (
              <div>
                {teacherLessons.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
                    <FileText className="text-gray-300 mx-auto mb-3" size={44} />
                    <h3 className="text-base font-bold text-gray-800 high-contrast:text-white">
                      {selectedTeacher.name} has not authored any lessons or notes
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Publish study notes and lesson guides for their students.</p>
                    <button
                      onClick={() => handleOpenLessonModal(null, selectedTeacher._id)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-all"
                    >
                      <Plus size={14} /> Create Note for {selectedTeacher.name}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teacherLessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 high-contrast:bg-gray-800 high-contrast:text-yellow-400">
                              {lesson.category}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                lesson.difficulty === 'Advanced'
                                  ? 'bg-red-100 text-red-700'
                                  : lesson.difficulty === 'Intermediate'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {lesson.difficulty || 'Beginner'}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-gray-900 high-contrast:text-white leading-snug">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed high-contrast:text-gray-400">
                            {lesson.content}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between high-contrast:border-gray-800">
                          <span className="text-[11px] text-gray-400">
                            {new Date(lesson.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenLessonModal(lesson, selectedTeacher._id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Lesson"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Teacher Tasks Sub-Tab */}
            {teacherContentSubTab === 'tasks' && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden high-contrast:bg-gray-900 high-contrast:border-yellow-400">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 high-contrast:bg-gray-800 high-contrast:border-gray-700">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Task Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Assigned Students</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 high-contrast:divide-gray-800">
                      {teacherTasks.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-16 text-center text-gray-400 font-medium">
                            No tasks have been assigned by this teacher yet.
                          </td>
                        </tr>
                      ) : (
                        teacherTasks.map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50 transition-colors high-contrast:hover:bg-black">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 high-contrast:text-white">{t.title}</p>
                              <p className="text-xs text-gray-500 high-contrast:text-gray-400">
                                {t.lesson?.title || 'General Activity'}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-800 high-contrast:text-white">
                              {t.students?.length || 0}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  t.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-gray-400">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // 1. Users Table (renders when no teacher is selected)
  const renderUserTable = () => {
    if (selectedTeacher) {
      return renderTeacherContentHub();
    }

    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden high-contrast:bg-gray-900 high-contrast:border-yellow-400">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 high-contrast:bg-gray-800 high-contrast:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User / Teacher</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Teacher Content</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 high-contrast:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                      <p className="text-gray-500 font-medium">Loading user directory...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="text-gray-300" size={48} />
                      <p className="text-gray-500 font-medium">No users or teachers match your search filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isTeacher = u.role === 'teacher';
                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-gray-50 transition-colors high-contrast:hover:bg-black group ${
                        isTeacher ? 'cursor-pointer hover:bg-indigo-50/40' : ''
                      }`}
                      onClick={() => {
                        if (isTeacher) handleSelectTeacher(u);
                      }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'teacher'
                                ? 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors'
                                : 'bg-emerald-100 text-emerald-700'
                            } high-contrast:bg-gray-800 high-contrast:text-white`}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 high-contrast:text-white flex items-center gap-1.5">
                                {u.name}
                                {isTeacher && (
                                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold group-hover:bg-indigo-100">
                                    Click to view content →
                                  </span>
                                )}
                              </p>
                              {u._id === currentUser?._id && (
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-blue-100 text-blue-700">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 high-contrast:text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'teacher'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          } high-contrast:border high-contrast:border-yellow-400 high-contrast:text-yellow-400 high-contrast:bg-transparent`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {isTeacher ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTeacher(u);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            <FolderOpen size={14} />
                            <span>Manage Content</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center text-sm text-gray-500 high-contrast:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            title="Edit User"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all high-contrast:text-yellow-400"
                          >
                            <Edit2 size={17} />
                          </button>
                          {u._id !== currentUser?._id && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              title="Delete User"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all high-contrast:text-red-500"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 2. Video Lectures Grid (Global)
  const renderVideosGrid = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
          <p className="text-gray-500 mt-3 font-medium">Loading video lectures...</p>
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
          <Video className="text-gray-300 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 high-contrast:text-white">No video lectures available</h3>
          <p className="text-gray-500 text-sm mt-1">Upload a lecture video or add a YouTube lesson to get started.</p>
          <button
            onClick={() => handleOpenLectureModal()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus size={16} /> Add First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLectures.map((lecture) => (
            <div
              key={lecture._id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400 group"
            >
              <div className="relative aspect-video bg-gray-900 overflow-hidden flex items-center justify-center">
                {lecture.thumbnailUrl ? (
                  <img
                    src={lecture.thumbnailUrl}
                    alt={lecture.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
                    <Video size={48} className="text-gray-700" />
                  </div>
                )}
                <button
                  onClick={() => setPreviewLecture(lecture)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center transition-all transform hover:scale-110 backdrop-blur-sm"
                  aria-label="Play video"
                >
                  <Play size={20} className="fill-current ml-0.5" />
                </button>
                <span
                  className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-md ${
                    lecture.type === 'youtube' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {lecture.type === 'youtube' ? <Youtube size={12} /> : <Upload size={12} />}
                  {lecture.type === 'youtube' ? 'YouTube' : 'Uploaded Video'}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="font-extrabold text-gray-900 text-base leading-snug hover:text-blue-600 transition-colors cursor-pointer high-contrast:text-white"
                    onClick={() => setPreviewLecture(lecture)}
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
                  <div className="text-xs text-gray-400">
                    <button
                      type="button"
                      onClick={() => {
                        if (lecture.teacher?._id) {
                          setActiveTab('users');
                          handleSelectTeacher(lecture.teacher);
                        }
                      }}
                      className="font-bold text-indigo-600 hover:underline flex items-center gap-1 high-contrast:text-yellow-400 text-left"
                    >
                      <User size={12} />
                      {lecture.teacher?.name || 'Instructor'}
                    </button>
                    <span className="block text-[10px] text-gray-400">
                      {new Date(lecture.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewLecture(lecture)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 high-contrast:text-yellow-400"
                    >
                      Watch <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteLecture(lecture._id, lecture.title)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 3. Text & Notes (Lessons) View (Global)
  const renderLessonsView = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={36} />
          <p className="text-gray-500 mt-3 font-medium">Loading educational notes & lessons...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
          <BookOpen className="text-gray-300 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 high-contrast:text-white">No lessons or notes found</h3>
          <p className="text-gray-500 text-sm mt-1">Publish new learning notes and educational materials for students.</p>
          <button
            onClick={() => handleOpenLessonModal()}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
          >
            <Plus size={16} /> Create Lesson / Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson._id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all high-contrast:bg-gray-900 high-contrast:border-yellow-400"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 high-contrast:bg-gray-800 high-contrast:text-yellow-400">
                    {lesson.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      lesson.difficulty === 'Advanced'
                        ? 'bg-red-100 text-red-700'
                        : lesson.difficulty === 'Intermediate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {lesson.difficulty || 'Beginner'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 high-contrast:text-white leading-snug">
                  {lesson.title}
                </h3>
                <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed high-contrast:text-gray-400">
                  {lesson.content}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between high-contrast:border-gray-800">
                <div className="text-xs">
                  {lesson.author ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('users');
                        handleSelectTeacher(lesson.author);
                      }}
                      className="font-bold text-indigo-600 hover:underline flex items-center gap-1 text-left"
                    >
                      <User size={12} />
                      {lesson.author.name}
                    </button>
                  ) : (
                    <span className="font-bold text-gray-500">Administrator</span>
                  )}
                  <span className="text-[10px] text-gray-400 block">
                    {new Date(lesson.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenLessonModal(lesson)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors high-contrast:text-yellow-400"
                    title="Edit Lesson"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Lesson"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 4. Tasks Monitoring View
  const renderTasksView = () => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden high-contrast:bg-gray-900 high-contrast:border-yellow-400">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 high-contrast:bg-gray-800 high-contrast:border-gray-700">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Task / Lesson</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Assigned By</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Students</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 high-contrast:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-gray-500 font-medium">Loading tasks...</p>
                  </div>
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ClipboardList className="text-gray-300" size={48} />
                    <p className="text-gray-500 font-medium">No tasks found on the platform.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors high-contrast:hover:bg-black group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center high-contrast:bg-gray-800 high-contrast:text-white">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 high-contrast:text-white">{t.title}</p>
                        <p className="text-xs text-gray-500 high-contrast:text-gray-400">
                          {t.lesson?.title || 'Unknown Lesson'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (t.teacher?._id) {
                            setActiveTab('users');
                            handleSelectTeacher(t.teacher);
                          }
                        }}
                        className="text-sm font-bold text-indigo-600 hover:underline high-contrast:text-yellow-400"
                      >
                        {t.teacher?.name || 'N/A'}
                      </button>
                      <span className="text-[10px] text-gray-400 uppercase font-black">{t.teacher?.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-lg font-black text-gray-900 high-contrast:text-white">
                      {t.students?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        t.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right text-sm text-gray-500 high-contrast:text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 5. Admin Profile View
  const renderProfileView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center high-contrast:bg-gray-900 high-contrast:border-yellow-400">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-purple-200 high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:shadow-none mb-4">
          {currentUser?.name?.charAt(0).toUpperCase() || <Shield size={40} />}
        </div>
        <h2 className="text-2xl font-black text-gray-900 high-contrast:text-white">{currentUser?.name}</h2>
        <p className="text-sm text-gray-500 mt-1 high-contrast:text-gray-400">{currentUser?.email}</p>
        <span className="mt-3 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200 high-contrast:bg-transparent high-contrast:text-yellow-400 high-contrast:border-yellow-400">
          Super Administrator
        </span>

        <div className="w-full border-t border-gray-100 mt-6 pt-6 space-y-3 text-left high-contrast:border-gray-800">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Account Role</span>
            <span className="font-bold text-gray-800 capitalize high-contrast:text-white">{currentUser?.role}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Platform Teachers</span>
            <span className="font-bold text-gray-800 high-contrast:text-white">{stats.teachersCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Platform Students</span>
            <span className="font-bold text-gray-800 high-contrast:text-white">{stats.studentsCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Total Video Lectures</span>
            <span className="font-bold text-gray-800 high-contrast:text-white">{stats.lecturesCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider">Total Notes & Lessons</span>
            <span className="font-bold text-gray-800 high-contrast:text-white">{stats.lessonsCount}</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center high-contrast:bg-gray-800 high-contrast:text-yellow-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 high-contrast:text-white">Admin Account Credentials</h3>
              <p className="text-xs text-gray-500">Update your login username (display name) and registered admin email.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Admin Full Name / Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="Admin Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Admin Login Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={profileFormData.email}
                  onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="admin@equaled.com"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSubmitting}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-100 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                {profileSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Update Account Information
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 high-contrast:bg-gray-900 high-contrast:border-yellow-400">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center high-contrast:bg-gray-800 high-contrast:text-yellow-400">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 high-contrast:text-white">Security & Password</h3>
              <p className="text-xs text-gray-500">Change your secret admin login password.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Current Password <span className="font-normal text-gray-400">(optional verification)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    required
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    required
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="px-6 py-3.5 rounded-2xl bg-black text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                {passwordSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                Set New Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 high-contrast:bg-black font-inter flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header & Main Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 high-contrast:border high-contrast:border-yellow-400 high-contrast:text-yellow-400 high-contrast:bg-transparent">
                  Administrator Portal
                </span>
                {selectedTeacher && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                    Inspecting {selectedTeacher.name}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-2 high-contrast:text-yellow-400">
                {selectedTeacher ? `${selectedTeacher.name}'s Content Hub` : 'Central Platform Control'}
              </h1>
              <p className="text-gray-500 mt-1 text-sm high-contrast:text-gray-400">
                {selectedTeacher
                  ? `Viewing and managing all videos, text notes, and lessons published by ${selectedTeacher.name}.`
                  : 'Manage all content (videos, text notes), inspect any teacher\'s uploaded library, oversee users, and customize your profile.'}
              </p>
            </div>

            {/* Quick Action Buttons for Current Tab */}
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'users' && !selectedTeacher && (
                <>
                  <button
                    onClick={() => handleOpenUserModal(null, 'teacher')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
                  >
                    <GraduationCap size={18} />
                    <span>Add Teacher</span>
                  </button>
                  <button
                    onClick={() => handleOpenUserModal(null, 'student')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95 high-contrast:bg-yellow-400 high-contrast:text-black"
                  >
                    <UserPlus size={18} />
                    <span>Add Student</span>
                  </button>
                </>
              )}

              {activeTab === 'videos' && (
                <button
                  onClick={() => handleOpenLectureModal()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  <Plus size={18} />
                  <span>Upload / Add Video</span>
                </button>
              )}

              {activeTab === 'lessons' && (
                <button
                  onClick={() => handleOpenLessonModal()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  <Plus size={18} />
                  <span>Create Lesson / Note</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Pill Bar */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto mb-8 high-contrast:bg-gray-900 high-contrast:border-gray-800">
            {[
              { id: 'users', label: 'Users & Teachers', icon: Users, count: stats.totalUsers },
              { id: 'videos', label: 'Videos & Lectures', icon: Video, count: stats.lecturesCount },
              { id: 'lessons', label: 'Text & Notes', icon: FileText, count: stats.lessonsCount },
              { id: 'tasks', label: 'Teacher Tasks', icon: ClipboardList, count: stats.tasksCount },
              { id: 'profile', label: 'Admin Profile', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'users') {
                      setSelectedTeacher(null);
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
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
                          ? 'bg-white/25 text-white high-contrast:bg-black high-contrast:text-yellow-400'
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

          {/* Search & Filter Bar (shown on collection views, only when not inspecting a single teacher) */}
          {activeTab !== 'profile' && !selectedTeacher && (
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6 high-contrast:bg-gray-900 high-contrast:border-gray-800">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                />
              </div>

              {/* Dynamic Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                {activeTab === 'users' &&
                  ['all', 'teacher', 'student', 'admin'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setUserRoleFilter(f)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                        userRoleFilter === f
                          ? 'bg-blue-600 text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 high-contrast:bg-gray-800 high-contrast:text-white'
                      }`}
                    >
                      {f === 'all' ? 'All Roles' : `${f}s`}
                    </button>
                  ))}

                {(activeTab === 'videos' || activeTab === 'lessons') && teachersList.length > 0 && (
                  <select
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-800 border-0 outline-none high-contrast:bg-gray-800 high-contrast:text-white"
                  >
                    <option value="all">All Teachers / Authors</option>
                    {teachersList.map((t) => (
                      <option key={t._id} value={t._id}>
                        Teacher: {t.name}
                      </option>
                    ))}
                  </select>
                )}

                {activeTab === 'lessons' && lessonCategories.length > 0 && (
                  <select
                    value={lessonCategoryFilter}
                    onChange={(e) => setLessonCategoryFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gray-50 border-0 outline-none high-contrast:bg-gray-800 high-contrast:text-white"
                  >
                    <option value="all">All Categories</option>
                    {lessonCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}

                {activeTab === 'tasks' &&
                  ['all', 'assigned', 'completed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTaskStatusFilter(f)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                        taskStatusFilter === f
                          ? 'bg-blue-600 text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 high-contrast:bg-gray-800 high-contrast:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Active Tab View Content */}
          {activeTab === 'users' && renderUserTable()}
          {activeTab === 'videos' && renderVideosGrid()}
          {activeTab === 'lessons' && renderLessonsView()}
          {activeTab === 'tasks' && renderTasksView()}
          {activeTab === 'profile' && renderProfileView()}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* 1. User / Teacher Add & Edit Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseUserModal} />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 high-contrast:bg-gray-900 high-contrast:border-2 high-contrast:border-yellow-400">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center high-contrast:border-gray-800">
              <h2 className="text-xl font-black text-gray-900 high-contrast:text-white">
                {editingUser ? 'Edit User Details' : `Register New ${userFormData.role === 'teacher' ? 'Teacher' : 'User'}`}
              </h2>
              <button
                onClick={handleCloseUserModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors high-contrast:text-yellow-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="sarah@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  {editingUser ? 'Reset Password (leave empty to keep unchanged)' : 'Initial Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Role
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Disability
                  </label>
                  <select
                    value={userFormData.disabilityType}
                    onChange={(e) => setUserFormData({ ...userFormData, disabilityType: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  >
                    <option value="none">None</option>
                    <option value="visual">Visual</option>
                    <option value="hearing">Hearing</option>
                    <option value="motor">Motor</option>
                    <option value="cognitive">Cognitive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="w-full py-4 rounded-2xl bg-black text-white font-bold text-base hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  {userSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                  {editingUser ? 'Save Updates' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Video Lecture Upload / Add Modal */}
      {lectureModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLectureModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 high-contrast:bg-gray-900 high-contrast:border-2 high-contrast:border-yellow-400">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center high-contrast:border-gray-800">
              <h2 className="text-xl font-black text-gray-900 high-contrast:text-white">
                {selectedTeacher ? `Add Video for ${selectedTeacher.name}` : 'Add Video Lecture'}
              </h2>
              <button
                onClick={() => setLectureModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors high-contrast:text-yellow-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 pb-0">
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl high-contrast:bg-gray-800">
                <button
                  type="button"
                  onClick={() => setLectureTab('youtube')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    lectureTab === 'youtube'
                      ? 'bg-white text-red-600 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black'
                      : 'text-gray-500 hover:text-gray-900 high-contrast:text-white'
                  }`}
                >
                  <Youtube size={16} /> YouTube URL
                </button>
                <button
                  type="button"
                  onClick={() => setLectureTab('upload')}
                  className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    lectureTab === 'upload'
                      ? 'bg-white text-blue-600 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black'
                      : 'text-gray-500 hover:text-gray-900 high-contrast:text-white'
                  }`}
                >
                  <Upload size={16} /> Video File Upload
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveLecture} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Assign to Teacher / Author
                </label>
                <select
                  value={lectureFormData.teacherId}
                  onChange={(e) => setLectureFormData({ ...lectureFormData, teacherId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                >
                  <option value="">(Self) Platform Administrator</option>
                  {teachersList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Lecture Title
                </label>
                <input
                  required
                  type="text"
                  value={lectureFormData.title}
                  onChange={(e) => setLectureFormData({ ...lectureFormData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="e.g. Introduction to Accessibility in Web"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={3}
                  value={lectureFormData.description}
                  onChange={(e) => setLectureFormData({ ...lectureFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="Brief overview of what students will learn from this lecture..."
                />
              </div>

              {lectureTab === 'youtube' ? (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    YouTube Video URL
                  </label>
                  <input
                    type="url"
                    required
                    value={lectureFormData.youtubeUrl}
                    onChange={(e) => setLectureFormData({ ...lectureFormData, youtubeUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Choose Video File (MP4, WebM, MOV)
                  </label>
                  <input
                    type="file"
                    required
                    accept="video/*"
                    onChange={(e) => setLectureFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={lectureSubmitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  {lectureSubmitting ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                  Publish Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Text & Notes (Lesson) Modal */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLessonModalOpen(false)} />
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 high-contrast:bg-gray-900 high-contrast:border-2 high-contrast:border-yellow-400 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center high-contrast:border-gray-800">
              <h2 className="text-xl font-black text-gray-900 high-contrast:text-white">
                {editingLesson
                  ? 'Edit Educational Notes / Lesson'
                  : selectedTeacher
                  ? `Create Notes for ${selectedTeacher.name}`
                  : 'Create New Lesson & Notes'}
              </h2>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors high-contrast:text-yellow-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Assign Author / Teacher
                </label>
                <select
                  value={lessonFormData.authorId}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, authorId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                >
                  <option value="">(Self) Platform Administrator</option>
                  {teachersList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Lesson Title
                </label>
                <input
                  required
                  type="text"
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="e.g. Fundamental Laws of Motion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Category / Subject
                  </label>
                  <input
                    required
                    type="text"
                    value={lessonFormData.category}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                    placeholder="e.g. Physics, Math, CS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                    Difficulty Level
                  </label>
                  <select
                    value={lessonFormData.difficulty}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, difficulty: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Full Educational Notes / Text Content
                </label>
                <textarea
                  required
                  rows={8}
                  value={lessonFormData.content}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-sans text-sm leading-relaxed high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
                  placeholder="Write clear, comprehensive educational text and study notes for students..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={lessonSubmitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  {lessonSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                  {editingLesson ? 'Save Notes Updates' : 'Publish Lesson & Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Interactive Video Preview Modal */}
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
                  {previewLecture.type === 'youtube' ? 'YouTube' : 'Uploaded'}
                </span>
                <span className="text-xs text-gray-400">
                  By {previewLecture.teacher?.name || 'Administrator'} ·{' '}
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
