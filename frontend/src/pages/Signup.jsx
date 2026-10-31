import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API_BASE from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    disabilityType: '' // Fixed to match backend model
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        disabilityType: formData.disabilityType || 'none', 
      };

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Account created! Welcome, ${data.name} 🎉`, 'success');
        setTimeout(() => register(data), 1000);
      } else {
        setError(data.message || 'Registration failed');
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      setError('An error occurred during registration');
      showToast('Could not connect to server. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 high-contrast:bg-black flex flex-col">
      <Navbar />
      <div className="flex-grow pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto w-full">
        <div className="bg-white p-8 rounded-2xl shadow-xl high-contrast:bg-gray-900 high-contrast:border high-contrast:border-yellow-400">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 high-contrast:text-yellow-400">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">I am a...</label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                 <option value="student">Student</option>
                 <option value="teacher">Teacher</option>
                 <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 high-contrast:text-white">
                  Disability Profile <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                  value={formData.disabilityType || ''}
                  onChange={(e) => setFormData({...formData, disabilityType: e.target.value})}
                >
                   <option value="">None / Prefer not to say</option>
                   <option value="visual">Visual Impairment</option>
                   <option value="hearing">Hearing Impairment</option>
                   <option value="motor">Motor Impairment</option>
                   <option value="cognitive">Cognitive Disability</option>
                </select>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Creating Account...</> : 'Sign Up'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-gray-600 high-contrast:text-gray-300">
            Already have an account? {' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline high-contrast:text-yellow-400">
              Login
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
