import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  Video, Youtube, Upload, Trash2, Play, X,
  Plus, CheckCircle, AlertCircle, ChevronRight, Loader
} from 'lucide-react';
import API_BASE from '../utils/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractYouTubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function getEmbedUrl(lecture) {
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

const authHeader = () => {
  const u = JSON.parse(localStorage.getItem('user'));
  return { Authorization: `Bearer ${u?.token}` };
};

// ─── Video Player Modal ───────────────────────────────────────────────────────

const PlayerModal = ({ lecture, onClose }) => {
  const src = getEmbedUrl(lecture);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/40 rounded-full p-1"
        >
          <X size={22} />
        </button>
        <div className="aspect-video w-full">
          {lecture.type === 'youtube' ? (
            <iframe
              src={src}
              title={lecture.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <video
              src={src}
              controls
              autoPlay
              className="w-full h-full"
            />
          )}
        </div>
        <div className="p-4 bg-gray-900">
          <h3 className="text-white font-bold text-lg">{lecture.title}</h3>
          {lecture.description && (
            <p className="text-gray-400 text-sm mt-1">{lecture.description}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            By {lecture.teacher?.name} · {new Date(lecture.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Lecture Card ─────────────────────────────────────────────────────────────

const LectureCard = ({ lecture, onPlay, onDelete, isTeacher, currentUserId }) => {
  const canDelete = isTeacher && lecture.teacher?._id === currentUserId;
  const thumb = lecture.thumbnailUrl ||
    (lecture.type === 'youtube'
      ? `https://img.youtube.com/vi/${extractYouTubeId(lecture.youtubeUrl)}/hqdefault.jpg`
      : null);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col high-contrast:bg-gray-900 high-contrast:border-gray-700">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-gray-100 cursor-pointer overflow-hidden"
        onClick={() => onPlay(lecture)}
      >
        {thumb ? (
          <img src={thumb} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <Video size={40} className="text-blue-300" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-200">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
            <Play size={24} className="text-blue-600 fill-blue-600 ml-1" />
          </div>
        </div>
        {/* Badge */}
        <span className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
          lecture.type === 'youtube'
            ? 'bg-red-500 text-white'
            : 'bg-blue-600 text-white'
        }`}>
          {lecture.type === 'youtube' ? <Youtube size={11} /> : <Upload size={11} />}
          {lecture.type === 'youtube' ? 'YouTube' : 'Video'}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="font-bold text-gray-900 leading-snug mb-1 cursor-pointer hover:text-blue-600 transition-colors high-contrast:text-white"
          onClick={() => onPlay(lecture)}
        >
          {lecture.title}
        </h3>
        {lecture.description && (
          <p className="text-sm text-gray-500 line-clamp-2 high-contrast:text-gray-400">{lecture.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {lecture.teacher?.name} · {new Date(lecture.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlay(lecture)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 high-contrast:text-yellow-400"
            >
              Watch <ChevronRight size={14} />
            </button>
            {canDelete && (
              <button
                onClick={() => onDelete(lecture)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete lecture"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Upload Panel (teacher only) ──────────────────────────────────────────────

const UploadPanel = ({ onCreated }) => {
  const [tab, setTab] = useState('youtube'); // 'youtube' | 'upload'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const ytPreviewId = tab === 'youtube' ? extractYouTubeId(youtubeUrl) : null;

  const reset = () => {
    setTitle(''); setDescription(''); setYoutubeUrl(''); setVideoFile(null); setError(''); setSuccess('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (tab === 'youtube' && !youtubeUrl.trim()) { setError('Please enter a YouTube URL.'); return; }
    if (tab === 'upload' && !videoFile) { setError('Please select a video file.'); return; }

    setLoading(true);
    try {
      let res, data;

      if (tab === 'youtube') {
        res = await fetch(`${API_BASE}/api/lectures`, {
          method: 'POST',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, type: 'youtube', youtubeUrl }),
        });
        data = await res.json();
      } else {
        const form = new FormData();
        form.append('title', title);
        form.append('description', description);
        form.append('type', 'upload');
        form.append('video', videoFile);
        res = await fetch(`${API_BASE}/api/lectures`, {
          method: 'POST',
          headers: authHeader(),
          body: form,
        });
        data = await res.json();
      }

      if (res.ok) {
        setSuccess('Lecture added successfully!');
        onCreated(data);
        setTimeout(reset, 1500);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 shadow-sm high-contrast:bg-gray-900 high-contrast:border-gray-800">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 high-contrast:text-white">
        <Plus size={20} className="text-blue-600" /> Add New Lecture
      </h2>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'youtube', icon: Youtube, label: 'YouTube Link' },
          { key: 'upload', icon: Upload, label: 'Upload Video' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 high-contrast:bg-gray-800 high-contrast:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">
            Lecture Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Algebra"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this lecture..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
          />
        </div>

        {tab === 'youtube' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">
              YouTube URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
            />
            {ytPreviewId && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 aspect-video max-w-sm">
                <img
                  src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 high-contrast:text-white">
              Video File <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all high-contrast:border-gray-700 high-contrast:hover:bg-gray-800"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files[0] || null)}
              />
              {videoFile ? (
                <div className="flex items-center justify-center gap-3 text-blue-600">
                  <Video size={24} />
                  <span className="font-semibold text-sm">{videoFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setVideoFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to select a video file</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV, MKV — up to 500 MB</p>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 high-contrast:bg-yellow-400 high-contrast:text-black"
        >
          {loading ? <><Loader size={18} className="animate-spin" /> Uploading...</> : <><Plus size={18} /> Add Lecture</>}
        </button>
      </form>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Lectures = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLecture, setActiveLecture] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lectures`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok) setLectures(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newLecture) => {
    setLectures((prev) => [newLecture, ...prev]);
  };

  const handleDelete = async (lecture) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lectures/${lecture._id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok) {
        setLectures((prev) => prev.filter((l) => l._id !== lecture._id));
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = lectures.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex bg-gray-50 min-h-screen high-contrast:bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-10 overflow-y-auto">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 high-contrast:text-yellow-400">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Video size={22} />
                </div>
                Lectures
              </h1>
              <p className="text-gray-500 mt-1 high-contrast:text-gray-300">
                {isTeacher
                  ? 'Upload and manage video lectures for your students.'
                  : 'Watch lectures shared by your teacher.'}
              </p>
            </div>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lectures..."
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full sm:w-64 high-contrast:bg-black high-contrast:border-gray-700 high-contrast:text-white"
            />
          </div>

          {/* Teacher upload panel */}
          {isTeacher && <UploadPanel onCreated={handleCreated} />}

          {/* Lectures grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader size={36} className="animate-spin text-blue-500" />
              <p className="text-gray-400">Loading lectures...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Video size={36} className="text-blue-300" />
              </div>
              <p className="text-gray-500 high-contrast:text-gray-400 text-center">
                {search
                  ? 'No lectures match your search.'
                  : isTeacher
                  ? 'No lectures yet. Add your first one above!'
                  : 'No lectures have been uploaded yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">{filtered.length} lecture{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((lecture) => (
                  <LectureCard
                    key={lecture._id}
                    lecture={lecture}
                    onPlay={setActiveLecture}
                    onDelete={setDeleteConfirm}
                    isTeacher={isTeacher}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Video player modal */}
      {activeLecture && (
        <PlayerModal lecture={activeLecture} onClose={() => setActiveLecture(null)} />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm high-contrast:bg-gray-900 high-contrast:border high-contrast:border-gray-700">
            <h3 className="font-bold text-gray-900 text-lg mb-2 high-contrast:text-white">Delete Lecture?</h3>
            <p className="text-gray-500 text-sm mb-5 high-contrast:text-gray-400">
              "{deleteConfirm.title}" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all high-contrast:border-gray-700 high-contrast:text-white high-contrast:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lectures;
