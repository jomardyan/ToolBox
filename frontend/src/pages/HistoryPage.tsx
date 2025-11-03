import React from 'react';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Common';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory } = useAppStore();

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Conversion History</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No conversions yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Your conversion history will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion History</h2>
          <Button onClick={clearHistory} variant="danger" className="text-sm">
            🗑️ Clear All
          </Button>
        </div>

        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white uppercase text-sm">
                    {item.sourceFormat}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-semibold text-gray-900 dark:text-white uppercase text-sm">
                    {item.targetFormat}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  {item.status === 'success' ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
