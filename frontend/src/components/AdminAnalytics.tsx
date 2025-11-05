// frontend/src/components/AdminAnalytics.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import apiClient from '../utils/api';
import AdminLayout from './AdminLayout';

interface RevenueMetrics {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  pendingPayments: number;
  churnRate: number;
  monthly: Record<string, number>;
}

interface ApiMetrics {
  totalApiCalls: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  topErrors: Array<{ statusCode: number; count: number; percentage: number }>;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usuageDistribution: {
    heavyUsers: number;
    mediumUsers: number;
    lightUsers: number;
  };
}

export const AdminAnalytics: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueMetrics | null>(null);
  const [apiData, setApiData] = useState<ApiMetrics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [revenueRes, apiRes, userRes] = await Promise.all([
        apiClient.get('/admin/analytics/revenue'),
        apiClient.get('/admin/analytics/api'),
        apiClient.get('/admin/analytics/users'),
      ]);

      if (revenueRes.data.success) setRevenueData(revenueRes.data.data);
      if (apiRes.data.success) setApiData(apiRes.data.data);
      if (userRes.data.success) setUserAnalytics(userRes.data.data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const revenueChartData = revenueData
    ? Object.entries(revenueData.monthly).map(([date, value]) => ({
        date,
        revenue: value,
      }))
    : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <AdminLayout title="Analytics Dashboard">
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Revenue Overview Cards */}
        {revenueData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600">MRR</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ${revenueData.mrr.toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ${revenueData.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600">Active Subscriptions</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {revenueData.activeSubscriptions}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600">Churn Rate</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {revenueData.churnRate.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Revenue Trend Chart */}
        {revenueChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  name="Revenue"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* User Analytics */}
        {userAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Cards */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {userAnalytics.totalUsers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">Active Users (30d)</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {userAnalytics.activeUsers}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">New Users (This Month)</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {userAnalytics.newUsersThisMonth}
                </p>
              </div>
            </div>

            {/* Usage Distribution Pie */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Usage Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Heavy Users',
                        value: userAnalytics.usuageDistribution.heavyUsers,
                      },
                      {
                        name: 'Medium Users',
                        value: userAnalytics.usuageDistribution.mediumUsers,
                      },
                      {
                        name: 'Light Users',
                        value: userAnalytics.usuageDistribution.lightUsers,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* API Metrics */}
        {apiData && (
          <div className="space-y-6">
            {/* API Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">Total API Calls</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {apiData.totalApiCalls.toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">Error Rate</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {apiData.errorRate.toFixed(2)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">Avg Response Time</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {apiData.avgResponseTime}ms
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-sm font-semibold text-gray-600">P95 Response Time</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {apiData.p95ResponseTime}ms
                </p>
              </div>
            </div>

            {/* Top Errors */}
            {apiData.topErrors.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Errors</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={apiData.topErrors.map((e) => ({
                      status: `${e.statusCode}`,
                      count: e.count,
                      percentage: e.percentage,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#ef4444" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
