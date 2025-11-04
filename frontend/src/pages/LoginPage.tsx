import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      if (!email || !password) throw new Error('Email and password required');
      
      const response = await api.login({ email, password });
      
      if (response.data.success) {
        setUser(response.data.data.user);
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        if (rememberMe) localStorage.setItem('rememberMe', 'true');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center">Welcome Back</h2>
        <p className="mt-2 text-center text-gray-600">Sign in to your account</p>

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Remember me</label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign up</Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
