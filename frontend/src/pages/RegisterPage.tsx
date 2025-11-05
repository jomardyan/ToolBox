import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { FaUser, FaBuilding, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName || !formData.companyName || !formData.email || !formData.password) {
      setError('All fields required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms');
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      const response = await api.register({
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setUser(response.data.data.user);
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        alert('Account created! Please verify your email.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const { darkMode } = useAppStore();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-primary-500' : 'bg-primary-400'
        }`}></div>
        <div className={`absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-500' : 'bg-purple-400'
        }`}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className={`rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border ${
          darkMode 
            ? 'bg-gray-900/80 border-gray-800' 
            : 'bg-white/80 border-gray-200'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-shimmer animate-shimmer opacity-20"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                <FaUserPlus className="text-3xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Create Account</h2>
              <p className="mt-2 text-white/90">Join thousands of users today</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className={`mb-6 p-4 rounded-xl border-2 animate-scale-in ${
                darkMode 
                  ? 'bg-danger-900/20 border-danger-800 text-danger-300' 
                  : 'bg-danger-50 border-danger-200 text-danger-800'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium">Registration Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaBuilding className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Min. 8 characters with upper, lower, and numbers
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  required
                />
                <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  I accept the{' '}
                  <a href="/terms" className={`font-medium hover:underline ${
                    darkMode ? 'text-primary-400' : 'text-primary-600'
                  }`}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className={`font-medium hover:underline ${
                    darkMode ? 'text-primary-400' : 'text-primary-600'
                  }`}>
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className={`font-semibold hover:underline ${
                    darkMode ? 'text-primary-400' : 'text-primary-600'
                  }`}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            to="/" 
            className={`inline-flex items-center gap-2 text-sm hover:underline ${
              darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
