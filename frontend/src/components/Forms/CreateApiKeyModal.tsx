import { useState } from 'react';

interface CreateApiKeyModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export const CreateApiKeyModal = ({ onClose, onSubmit, isLoading }: CreateApiKeyModalProps) => {
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('90');
  const [permissions, setPermissions] = useState<string[]>(['read']);
  const [error, setError] = useState<string | null>(null);

  const handlePermissionChange = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!name.trim()) {
        setError('API key name is required');
        return;
      }

      if (permissions.length === 0) {
        setError('At least one permission must be selected');
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiresIn));

      await onSubmit({
        name: name.trim(),
        expiresAt: expirationDate.toISOString(),
        permissions,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    }
  };

  const permissionOptions = [
    { value: 'read', label: 'Read (Get data)' },
    { value: 'write', label: 'Write (Create/Update data)' },
    { value: 'delete', label: 'Delete (Remove data)' },
    { value: 'admin', label: 'Admin (Full access)' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create API Key</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a descriptive name to identify this key's purpose
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Expiration</label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="3650">Never expires</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Key will expire after selected period
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-2">
              {permissionOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.includes(option.value)}
                    onChange={() => handlePermissionChange(option.value)}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
