import { useState, useEffect } from 'react';
import { api } from '../../utils/apiClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdminRevenueCharts = () => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/analytics/revenue');
      if (response.data.success) {
        setRevenueData(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!revenueData) return null;

  const mrrTrend = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 12000 },
    { month: 'Mar', value: 15000 },
    { month: 'Apr', value: 18000 },
    { month: 'May', value: 21000 },
    { month: 'Jun', value: 24000 }
  ];

  const subscriptionBreakdown = [
    { name: 'Starter', value: 45 },
    { name: 'Pro', value: 35 },
    { name: 'Enterprise', value: 20 }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Monthly Recurring Revenue (MRR)</p>
          <p className="text-2xl font-bold text-gray-900">${(revenueData.mrr || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Annual Recurring Revenue (ARR)</p>
          <p className="text-2xl font-bold text-gray-900">${(revenueData.arr || 0).toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">↑ 18% YoY</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${(revenueData.total || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">All time</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Churn Rate</p>
          <p className="text-2xl font-bold text-gray-900">{(revenueData.churnRate || 0).toFixed(2)}%</p>
          <p className="text-xs text-red-600 mt-1">↑ {(revenueData.churnRate || 0).toFixed(2)}% this month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MRR Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mrrTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={{ fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Avg Customer Lifetime Value</span>
              <span className="font-semibold">${(revenueData.avgLTV || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Avg Revenue Per User</span>
              <span className="font-semibold">${(revenueData.arpu || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Revenue Retention</span>
              <span className="font-semibold">{(revenueData.retention || 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Net Revenue Retention</span>
              <span className="font-semibold text-green-600">{(revenueData.nrr || 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
