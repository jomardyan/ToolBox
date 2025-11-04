// frontend/src/components/Dashboard/ApiKeysManager.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';
import type { ApiKey } from '../../types/saas';

interface ApiKeyWithSecret extends ApiKey {
  key?: string;
}

export const ApiKeysManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await api.getApiKeys();
      setApiKeys(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!keyName.trim()) {
      setError('Key name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.createApiKey(keyName);
      setShowNewKey(response.data.data.key);
      setKeyName('');
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) {
      return;
    }

    try {
      await api.revokeApiKey(id);
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke API key');
    }
  };

  const rotateApiKey = async (id: string) => {
    if (!window.confirm('This will revoke the current key. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.rotateApiKey(id);
      setShowNewKey(response.data.data.key);
      await fetchApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rotate API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading && apiKeys.length === 0) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">API Keys</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {showNewKey && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
            <p className="text-sm text-blue-700 mb-2">Your new API key (save it now!):</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-white p-2 rounded border font-mono text-sm">
                {showNewKey}
              </code>
              <button
                onClick={() => copyToClipboard(showNewKey)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowNewKey(null)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Got it, dismiss
            </button>
          </div>
        )}

        {/* Create new key form */}
        <div className="bg-gray-50 p-4 rounded mb-6">
          <label className="block text-sm font-medium mb-2">Create New API Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production Key"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={createApiKey}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* API Keys list */}
        <div className="space-y-2">
          {apiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">No API keys yet. Create one above.</p>
          ) : (
            apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-gray-500">
                    {key.keyPrefix} • Created {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                  {key.lastUsedAt && (
                    <p className="text-xs text-gray-400">
                      Last used: {new Date(key.lastUsedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => rotateApiKey(key.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                  >
                    Rotate
                  </button>
                  <button
                    onClick={() => revokeApiKey(key.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiKeysManager;
