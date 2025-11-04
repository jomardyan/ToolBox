// frontend/src/components/Dashboard/UsageChart.tsx

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../utils/apiClient';
import type { UsageSummary, QuotaStatus } from '../../types/saas';

export const UsageChart: React.FC = () => {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const [usageRes, quotaRes] = await Promise.all([
        api.getUsageSummary(30),
        api.getQuotaStatus()
      ]);
      setUsage(usageRes.data.data);
      setQuota(quotaRes.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Quota Status */}
      {quota?.hasQuota && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Usage Quota</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{quota.used?.toLocaleString()} / {quota.limit?.toLocaleString()} requests</span>
              <span className="font-semibold">{quota.percentageUsed}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${quota.percentageUsed}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Resets on {new Date(quota.resetDate!).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      {usage && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Usage Overview (30 days)</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold">{usage.totalRequests.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">${usage.totalCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Daily Usage Chart */}
          <div className="mb-6">
            <p className="font-medium mb-4">Daily Usage</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usage.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Endpoints */}
          {usage.topEndpoints.length > 0 && (
            <div>
              <p className="font-medium mb-4">Top Endpoints</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usage.topEndpoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsageChart;
