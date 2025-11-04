import { useState, useEffect } from 'react';
import { api } from '../../utils/apiClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AdminApiStats = () => {
  const [apiData, setApiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiData();
  }, []);

  const fetchApiData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/analytics/api');
      if (response.data.success) {
        setApiData(response.data.data);
      }
    } catch (err: any) {
      setError('Failed to load API stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!apiData) return null;

  const requestTrend = [
    { day: 'Mon', requests: 45000, errors: 120 },
    { day: 'Tue', requests: 52000, errors: 98 },
    { day: 'Wed', requests: 48000, errors: 150 },
    { day: 'Thu', requests: 61000, errors: 75 },
    { day: 'Fri', requests: 55000, errors: 110 },
    { day: 'Sat', requests: 42000, errors: 90 },
    { day: 'Sun', requests: 38000, errors: 60 }
  ];

  const endpointUsage = [
    { endpoint: '/convert', requests: 15000 },
    { endpoint: '/extract', requests: 12000 },
    { endpoint: '/validate', requests: 9000 },
    { endpoint: '/batch', requests: 6000 },
    { endpoint: '/presets', requests: 3000 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900">{(apiData.totalRequests || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Error Rate</p>
          <p className="text-2xl font-bold text-red-600">{(apiData.errorRate || 0).toFixed(2)}%</p>
          <p className="text-xs text-gray-600 mt-1">{(apiData.errorCount || 0).toLocaleString()} errors</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900">{(apiData.avgResponseTime || 0).toFixed(0)}ms</p>
          <p className="text-xs text-gray-600 mt-1">P95: {(apiData.p95ResponseTime || 0).toFixed(0)}ms</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Uptime</p>
          <p className="text-2xl font-bold text-green-600">{(apiData.uptime || 99.9).toFixed(2)}%</p>
          <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request & Error Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={requestTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#3b82f6" dot={{ fill: '#3b82f6' }} />
            <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ef4444" dot={{ fill: '#ef4444' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Endpoints by Usage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={endpointUsage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="requests" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Requests/Second Peak</span>
              <span className="font-semibold">{(apiData.peakRps || 0).toFixed(2)} RPS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Avg RPS</span>
              <span className="font-semibold">{(apiData.avgRps || 0).toFixed(2)} RPS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Cache Hit Rate</span>
              <span className="font-semibold text-green-600">{(apiData.cacheHitRate || 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Data Processed</span>
              <span className="font-semibold">{(apiData.dataProcessed || 0).toFixed(2)} GB</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
          <div className="space-y-3">
            {[
              { code: '400', message: 'Bad Request', count: 156 },
              { code: '401', message: 'Unauthorized', count: 89 },
              { code: '429', message: 'Rate Limited', count: 45 },
              { code: '500', message: 'Server Error', count: 12 }
            ].map((error) => (
              <div key={error.code} className="flex justify-between items-center pb-3 border-b">
                <div>
                  <span className="font-semibold text-red-600">{error.code}</span>
                  <span className="text-gray-700 ml-2">{error.message}</span>
                </div>
                <span className="text-gray-900 font-semibold">{error.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
