import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, BookOpen, LogOut, User, Users, CheckCircle, UserPlus, X, ChevronsLeft, ChevronsRight, Mic, MicOff, Bot, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const { voiceEnabled, isAwake } = useAccessibility();

  const navItems = user?.role === 'teacher' ? [
    { to: "/teacher-dashboard", icon: <LayoutDashboard size={24} />, label: "Dashboard" },
    { to: "/manage-lessons", icon: <BookOpen size={24} />, label: "Manage Lessons" },
    { to: "/lectures", icon: <Video size={24} />, label: "Lectures" },
    { to: "/manage-students", icon: <UserPlus size={24} />, label: "My Students" },
    { to: "/student-progress", icon: <Users size={24} />, label: "Student Progress" },
    { to: "/submission-review", icon: <CheckCircle size={24} />, label: "Review Work" },
  ] : [
    { to: "/dashboard", icon: <LayoutDashboard size={24} />, label: "Portal Home", end: true },
    { to: "/dashboard?tab=lessons", icon: <BookOpen size={24} />, label: "Study Notes" },
    { to: "/dashboard?tab=videos", icon: <Video size={24} />, label: "Video Lectures" },
    { to: "/dashboard?tab=tasks", icon: <CheckCircle size={24} />, label: "My Tasks" },
    { to: "/talk-to-ai", icon: <Bot size={24} />, label: "Talk to AI" },
  ];

  return (
    <>
      { }
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30
          bg-gray-50 border-r border-gray-200
          flex flex-col p-4
          high-contrast:bg-black high-contrast:border-yellow-400
          transition-all duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        { }
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 z-40 high-contrast:bg-black high-contrast:border-yellow-400 high-contrast:text-yellow-400"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>

        { }
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 md:hidden"
          aria-label="Close sidebar"
        >
          <X size={22} />
        </button>

        <div className="mb-8 px-2 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <h1 className={`text-2xl font-bold text-blue-600 high-contrast:text-yellow-400 transition-all ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              CyberNinjas
            </h1>
            {isCollapsed && <span className="text-2xl font-bold text-blue-600 high-contrast:text-yellow-400">E</span>}
          </div>
          {user && !isCollapsed && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 flex items-center gap-3 high-contrast:bg-gray-900 high-contrast:border-gray-700 min-w-0">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 high-contrast:bg-yellow-900 high-contrast:text-yellow-400 flex-shrink-0">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm truncate high-contrast:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize high-contrast:text-gray-400 truncate">{user.role}</p>
              </div>
            </div>
          )}
          {user && isCollapsed && (
            <div className="mt-4 flex justify-center">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 high-contrast:bg-yellow-900 high-contrast:text-yellow-400">
                <User size={20} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              end={item.end}
              onClick={onClose}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : ''
                } ${isActive
                  ? "bg-blue-100 text-blue-700 font-semibold high-contrast:bg-yellow-900 high-contrast:text-yellow-300"
                  : "text-gray-600 hover:bg-gray-100 high-contrast:text-white high-contrast:hover:bg-gray-800"
                }`
              }
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!isCollapsed && <span className="text-lg leading-tight truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-2 flex-shrink-0">

          {user && (
            <button
              onClick={logout}
              title={isCollapsed ? "Logout" : ""}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium high-contrast:text-red-400 high-contrast:hover:bg-gray-900 ${isCollapsed ? 'justify-center px-2' : ''
                }`}
            >
              <div className="flex-shrink-0"><LogOut size={24} /></div>
              {!isCollapsed && <span className="truncate">Logout</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
