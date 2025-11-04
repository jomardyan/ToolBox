import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/apiClient';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid or missing verification token');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.post('/auth/verify-email', { token });

        if (response.data.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to verify email');
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Verify Email</h2>
          <p className="mt-2 text-gray-600">Verifying your email address...</p>
        </div>

        {isVerifying && (
          <div className="mt-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Please wait while we verify your email...</p>
          </div>
        )}

        {error && (
          <div className="mt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm mb-4">
              {error}
            </div>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Back to Registration
            </button>
          </div>
        )}

        {success && (
          <div className="mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm mb-4">
              <div className="font-medium">Email verified successfully!</div>
              <div className="mt-1">You will be redirected to login...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
