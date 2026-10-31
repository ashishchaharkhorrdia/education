import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-4 max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl">

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={52} className="mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800">Check your email</h2>
              <p className="text-gray-500 text-sm">
                If <strong>{email}</strong> has an account, a password reset link has been sent.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 mt-4 text-blue-600 font-semibold hover:underline"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6">
                <ArrowLeft size={14} /> Back to Login
              </Link>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
