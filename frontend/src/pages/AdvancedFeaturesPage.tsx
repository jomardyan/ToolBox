import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiZap, FiSave } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';
import BatchProcessor from '../components/BatchProcessor';
import PresetsManager from '../components/PresetsManager';
import type { ConversionPreset } from '../utils/api';
import { getPageSEO, formatKeywords, generateBreadcrumbSchema, BASE_URL } from '../utils/seo';

export const AdvancedFeaturesPage: React.FC = () => {
  const { darkMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<'batch' | 'presets'>('batch');
  const [selectedPreset, setSelectedPreset] = useState<ConversionPreset | null>(null);
  
  const pageSEO = getPageSEO('advanced');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Advanced Features', url: `${BASE_URL}/advanced` },
  ]);

  const tabs = [
    { id: 'batch', label: 'Batch Processor', icon: FiZap, desc: 'Process multiple files at once' },
    { id: 'presets', label: 'Presets', icon: FiSave, desc: 'Save and reuse conversions' },
  ] as const;

  const tips = {
    batch: [
      'Upload multiple files with the same source and target formats',
      'Perfect for bulk conversions in workflows and automation',
      'Monitor progress with real-time status updates',
    ],
    presets: [
      'Save your favorite conversion combinations for quick reuse',
      'Organize presets by category for easy discovery',
      'Export presets as JSON to share with your team',
    ],
  };

  const useCases = {
    batch: [
      { title: 'Data Migration', desc: 'Convert hundreds of CSV files to JSON in one go' },
      { title: 'Report Generation', desc: 'Transform multiple data sources into standardized formats' },
      { title: 'Automation', desc: 'Integrate batch processing into your workflows' },
    ],
    presets: [
      { title: 'Quick Access', desc: 'One-click access to your most-used conversions' },
      { title: 'Team Standardization', desc: 'Share presets across team members' },
      { title: 'Consistency', desc: 'Ensure all conversions use the same settings' },
    ],
  };

  const benefits = [
    { icon: '⚡', label: 'Lightning Fast', desc: 'Process files in seconds' },
    { icon: '🔄', label: 'Flexible', desc: 'Support for 10+ formats' },
    { icon: '💾', label: 'Save & Reuse', desc: 'Presets for repeatability' },
    { icon: '📊', label: 'Real-time', desc: 'Live progress tracking' },
  ];

  return (
    <>
      <Helmet>
        <title>{pageSEO.title}</title>
        <meta name="description" content={pageSEO.description} />
        <meta name="keywords" content={formatKeywords(pageSEO.keywords)} />
        <link rel="canonical" href={pageSEO.canonical} />
        
        <meta property="og:type" content={pageSEO.ogType} />
        <meta property="og:url" content={pageSEO.canonical} />
        <meta property="og:title" content={pageSEO.title} />
        <meta property="og:description" content={pageSEO.description} />
        
        <meta name="twitter:card" content={pageSEO.twitterCard} />
        <meta name="twitter:title" content={pageSEO.title} />
        <meta name="twitter:description" content={pageSEO.description} />
        
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 ${
        darkMode ? 'bg-gray-950 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className={`text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent ${
              darkMode ? 'from-blue-400 to-blue-300' : ''
            }`}>
              Advanced Features
            </h1>
            <p className={`text-lg ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Unlock powerful tools for batch processing and workflow automation
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex gap-3 flex-wrap">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : darkMode
                      ? 'bg-gray-800 border-2 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="transition-all duration-300">
                {activeTab === 'batch' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      Batch Processor
                    </h3>
                    <BatchProcessor />

                    {/* Use Cases */}
                    <div className="mt-10">
                      <h5 className={`text-xl font-semibold mb-4 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        When to Use Batch Processing
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {useCases.batch.map((useCase, idx) => (
                          <div
                            key={idx}
                            className={`p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                              darkMode
                                ? 'border-gray-700 bg-gray-800 hover:border-blue-500'
                                : 'border-gray-300 bg-white hover:border-blue-500'
                            }`}
                          >
                            <h5 className={`font-semibold mb-2 ${
                              darkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {useCase.title}
                            </h5>
                            <p className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {useCase.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'presets' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      Presets Manager
                    </h3>
                    <PresetsManager onPresetSelect={setSelectedPreset} />

                    {/* Use Cases */}
                    <div className="mt-10">
                      <h5 className={`text-xl font-semibold mb-4 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        When to Use Presets
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {useCases.presets.map((useCase, idx) => (
                          <div
                            key={idx}
                            className={`p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                              darkMode
                                ? 'border-gray-700 bg-gray-800 hover:border-blue-500'
                                : 'border-gray-300 bg-white hover:border-blue-500'
                            }`}
                          >
                            <h5 className={`font-semibold mb-2 ${
                              darkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                              {useCase.title}
                            </h5>
                            <p className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {useCase.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Tips Section */}
                <div>
                  <h5 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    💡 Quick Tips
                  </h5>
                  <div className="space-y-2">
                    {tips[activeTab].map((tip, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                          darkMode
                            ? 'bg-blue-900/20 border-blue-500 text-blue-300'
                            : 'bg-blue-50 border-blue-500 text-blue-700'
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">✓</span>
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h5 className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Key Benefits
                  </h5>
                  <div className="space-y-3">
                    {benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg text-center transition-all duration-300 ${
                          darkMode
                            ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30 hover:border-blue-500/50'
                            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-2xl mb-2">{benefit.icon}</div>
                        <h6 className={`font-semibold mb-1 ${
                          darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {benefit.label}
                        </h6>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {benefit.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Preset Info */}
                {selectedPreset && (
                  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    darkMode
                      ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-cyan-50 border-cyan-400 text-cyan-700'
                  }`}>
                    <h6 className={`font-semibold mb-2 ${
                      darkMode ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>
                      ✓ Preset Loaded
                    </h6>
                    <p className={`mb-1 font-medium text-sm ${
                      darkMode ? 'text-cyan-200' : 'text-cyan-800'
                    }`}>
                      {selectedPreset.name}
                    </p>
                    <p className={`text-xs ${
                      darkMode ? 'text-cyan-300/70' : 'text-cyan-600/70'
                    }`}>
                      {selectedPreset.sourceFormat.toUpperCase()} → {selectedPreset.targetFormat.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFeaturesPage;
