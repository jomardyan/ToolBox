import React, { useState } from 'react';
import BatchProcessor from '../components/BatchProcessor';
import PresetsManager from '../components/PresetsManager';
import type { ConversionPreset } from '../utils/api';

export const AdvancedFeaturesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'batch' | 'presets'>('batch');
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset | null>(null);

  const tabs = [
    { id: 'batch', label: 'Batch Processor', icon: '📦' },
    { id: 'presets', label: 'Presets', icon: '⭐' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Features
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Batch process multiple conversions and manage your favorite presets
          </p>
        </div>

        {/* Notification if preset selected */}
        {selectedPreset && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Preset Selected: <strong>{selectedPreset.name}</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  {selectedPreset.sourceFormat.toUpperCase()} → {selectedPreset.targetFormat.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedPreset(null)}
                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="transition-all duration-200">
          {activeTab === 'batch' && (
            <div className="animate-fadeIn">
              <BatchProcessor />
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Tip: Batch Processing
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Add multiple items with different formats and convert them all at once. Perfect for
                  processing large datasets or multiple files in different formats.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="animate-fadeIn">
              <PresetsManager onPresetSelect={setSelectedPreset} />
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  💡 Tip: Conversion Presets
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Save your frequently used conversion settings as presets. Quickly access them from
                  the main conversion page without having to reconfigure formats each time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Batch Processing</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Convert multiple files at once and download all results in a single JSON file.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">💾</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save Presets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage conversion presets for your most common transformation tasks.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Progress</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor the status of each conversion item in your batch with detailed error messages.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AdvancedFeaturesPage;
