import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Type, Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import logo from './logo.png';
import slogo from './Cyber ninjas.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    highContrast, toggleContrast,
    increaseFont
  } = useAccessibility();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '#about' },
    { name: 'Features', path: '#features' },
    { name: 'How It Works', path: '#how-it-works' },
    { name: 'Contact', path: '#contact' },
    { name: 'API', path: '/developers' },
  ];

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setShowUserMenu(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'teacher') return '/teacher-dashboard';
    return '/dashboard';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 high-contrast:bg-black high-contrast:border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          { }
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Cyberninjas Logo" className="h-24 w-24 object-contain" />
            <img src={slogo} alt="Cyberninjas Text Logo" className="h-20 w-auto object-contain ml-1" />
          </Link>

          { }
          <div className="hidden md:flex items-center space-x-8">
            {!isAdmin && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors high-contrast:text-white high-contrast:hover:text-yellow-400"
              >
                {link.name}
              </a>
            ))}
          </div>

          { }
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full high-contrast:bg-gray-800">
              <button
                onClick={toggleContrast}
                className="p-2 hover:bg-white rounded-full transition-all high-contrast:text-yellow-400"
                aria-label="Toggle High Contrast"
              >
                {highContrast ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={increaseFont}
                className="p-2 hover:bg-white rounded-full transition-all high-contrast:text-yellow-400"
                aria-label="Increase Font Size"
              >
                <Type size={18} />
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3 relative">
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 high-contrast:text-white high-contrast:hover:text-yellow-400"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </Link>

                { }
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors high-contrast:bg-gray-900 high-contrast:border-yellow-400"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold high-contrast:bg-yellow-400 high-contrast:text-black">
                    {user.name?.charAt(0) || <User size={14} />}
                  </div>
                  <span className="text-sm font-bold text-gray-800 high-contrast:text-white">{user.name}</span>
                </button>

                { }
                {showUserMenu && (
                  <div className="absolute right-0 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 high-contrast:bg-black high-contrast:border-yellow-400">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1 high-contrast:border-gray-800">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider high-contrast:text-yellow-400">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate high-contrast:text-white">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin-dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors high-contrast:text-white high-contrast:hover:bg-gray-800"
                      >
                        <User size={16} />
                        Admin Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left high-contrast:hover:bg-red-900"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 font-medium hover:text-blue-600 high-contrast:text-white high-contrast:hover:text-yellow-400">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          { }
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600 high-contrast:text-yellow-400"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      { }
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full high-contrast:bg-black high-contrast:border-gray-800">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {!isAdmin && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 high-contrast:text-white high-contrast:hover:text-yellow-400 high-contrast:hover:bg-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              {user && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg high-contrast:bg-gray-900 high-contrast:border high-contrast:border-yellow-400">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold high-contrast:bg-yellow-400 high-contrast:text-black">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 high-contrast:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 high-contrast:text-gray-400 capitalize">{user.role}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 justify-center py-2">
                <button onClick={toggleContrast} className="flex items-center gap-2 text-gray-600 high-contrast:text-yellow-400">
                  {highContrast ? <Sun size={20} /> : <Moon size={20} />}
                  <span>Contrast</span>
                </button>
                <button onClick={increaseFont} className="flex items-center gap-2 text-gray-600 high-contrast:text-yellow-400">
                  <Type size={20} />
                  <span>Font Size</span>
                </button>
              </div>

              {user ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 high-contrast:bg-yellow-400 high-contrast:text-black"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center px-4 py-3 border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-50 high-contrast:border-red-500"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 high-contrast:text-white high-contrast:border-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 high-contrast:bg-yellow-400 high-contrast:text-black"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
