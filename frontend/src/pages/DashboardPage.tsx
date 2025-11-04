import { useEffect, useState } from 'react';
import { api } from '../utils/apiClient';

interface DashboardStats {
  activeSubscription: boolean;
  totalApiCalls: number;
  monthlyUsage: number;
  quotaRemaining: number;
  apiKeysCount: number;
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [quotaRes, keysRes] = await Promise.all([
          api.getQuotaStatus(),
          api.getApiKeys()
        ]);

        const quota = quotaRes.data.data;
        const keys = keysRes.data.data;

        setStats({
          activeSubscription: quota.status === 'ACTIVE',
          totalApiCalls: quota.totalUsage || 0,
          monthlyUsage: quota.currentUsage || 0,
          quotaRemaining: quota.remaining || 0,
          apiKeysCount: keys.length || 0
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium">Subscription Status</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">
            {stats.activeSubscription ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium">API Keys</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.apiKeysCount}</div>
          <a href="/dashboard/api-keys" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
            Manage →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium">This Month Usage</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.monthlyUsage}</div>
          <a href="/dashboard/usage" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
            View Details →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 font-medium">Quota Remaining</div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.quotaRemaining}</div>
          <a href="/dashboard/subscription" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
            Upgrade →
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Start</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/dashboard/api-keys" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="text-lg font-semibold text-gray-900">Create API Key</div>
            <p className="text-sm text-gray-600 mt-1">Generate a new API key for your application</p>
          </a>

          <a href="/dashboard/subscription" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="text-lg font-semibold text-gray-900">Manage Subscription</div>
            <p className="text-sm text-gray-600 mt-1">View and upgrade your subscription plan</p>
          </a>

          <a href="/dashboard/billing" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <div className="text-lg font-semibold text-gray-900">View Invoices</div>
            <p className="text-sm text-gray-600 mt-1">Download and review your billing history</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
