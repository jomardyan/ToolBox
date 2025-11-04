import { ApiKeysManager } from '../components/Dashboard/ApiKeysManager';

export const ApiKeysPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">API Keys Management</h2>
      <p className="text-gray-600 mb-6">Create and manage API keys for your applications</p>
      <ApiKeysManager />
    </div>
  );
};

export default ApiKeysPage;
