import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API_BASE from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [slowWarn, setSlowWarn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSlowWarn(false);
    const normalizedEmail = email.trim().toLowerCase();

    // Show "server waking up" warning after 4s
    const slowTimer = setTimeout(() => setSlowWarn(true), 4000);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Welcome back, ${data.name}! 👋`, 'success');
        setTimeout(() => login(data), 800);
      } else {
        setError(data.message || 'Login failed');
        showToast(data.message || 'Login failed', 'error');
      }
    } catch (err) {
      setError('Could not connect to server. Please try again.');
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowWarn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 high-contrast:bg-black flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl high-contrast:bg-gray-900 high-contrast:border high-contrast:border-yellow-400">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 high-contrast:text-yellow-400">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {slowWarn && (
              <div className="bg-amber-50 border border-amber-300 text-amber-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin flex-shrink-0" />
                Server is waking up (free tier). This may take 30–60 seconds on first login...
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white disabled:opacity-60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 high-contrast:text-white">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:underline high-contrast:text-yellow-400"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white disabled:opacity-60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 high-contrast:text-gray-300">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-semibold hover:underline high-contrast:text-yellow-400">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
