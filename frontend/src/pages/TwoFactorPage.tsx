import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export const TwoFactorPage = () => {
  const navigate = useNavigate();

  const [setupPhase, setSetupPhase] = useState<'setup' | 'verify' | 'backup' | 'done'>(
    'setup'
  );
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await api.get('/2fa/status');
      setIsEnabled(response.data.enabled);
      setBackupCodesRemaining(response.data.backupCodesRemaining);
    } catch (err: any) {
      console.error('Failed to check 2FA status:', err);
    }
  };

  const handleSetupStart = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setBackupCodes(response.data.backupCodes);
      setSetupPhase('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Verification code required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/2fa/enable', {
        secret,
        token: verificationCode,
        backupCodes,
      });

      setSuccess('2FA enabled successfully!');
      setSetupPhase('backup');
      await checkTwoFactorStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure? This will disable 2-factor authentication.')) {
      return;
    }

    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      await api.post('/2fa/disable', { password });
      setSuccess('2FA disabled successfully');
      setIsEnabled(false);
      setSetupPhase('setup');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'toolbox-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Two-Factor Authentication</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            {success}
          </div>
        )}

        {isEnabled ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                ✓ 2-Factor Authentication is <strong>enabled</strong>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Backup codes remaining: <strong>{backupCodesRemaining}</strong>
              </p>
            </div>

            {backupCodesRemaining < 3 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  ⚠ Running low on backup codes. Consider regenerating new ones.
                </p>
              </div>
            )}

            <button
              onClick={async () => {
                const password = prompt('Enter your password to regenerate backup codes:');
                if (password) {
                  setLoading(true);
                  try {
                    const response = await api.post('/2fa/regenerate-backup-codes', { password });
                    setBackupCodes(response.data.backupCodes);
                    setSetupPhase('backup');
                    setSuccess('Backup codes regenerated successfully');
                    await checkTwoFactorStatus();
                  } catch (err: any) {
                    setError(err.message || 'Failed to regenerate backup codes');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:bg-gray-400"
              disabled={loading}
            >
              Regenerate Backup Codes
            </button>

            <button
              onClick={handleDisable}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition disabled:bg-gray-400"
              disabled={loading}
            >
              Disable 2FA
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {setupPhase === 'setup' && (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Two-factor authentication adds an extra layer of security to your account.
                  You'll need to enter a code from an authenticator app in addition to your password
                  when logging in.
                </p>

                <button
                  onClick={handleSetupStart}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : 'Setup 2FA'}
                </button>
              </div>
            )}

            {setupPhase === 'verify' && (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>

                {qrCode && (
                  <div className="flex justify-center mb-4">
                    <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                  </div>
                )}

                <p className="text-gray-600 text-xs mb-2">Or enter this code manually:</p>
                <p className="font-mono text-sm bg-gray-100 p-3 rounded mb-4 break-all">{secret}</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleVerify}
                  className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:bg-gray-400"
                  disabled={loading || !verificationCode}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}

            {setupPhase === 'backup' && (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Save your backup codes in a safe place. You can use them to access your account
                  if you lose access to your authenticator app:
                </p>

                <div className="bg-gray-100 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-gray-700">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDownloadBackupCodes}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition mb-2"
                >
                  Download Backup Codes
                </button>

                <button
                  onClick={() => {
                    setSetupPhase('done');
                    setSuccess('2FA setup complete!');
                    setTimeout(() => navigate('/account'), 2000);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
