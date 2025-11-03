import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiZap, FiSave } from 'react-icons/fi';
import BatchProcessor from '../components/BatchProcessor';
import PresetsManager from '../components/PresetsManager';
import type { ConversionPreset } from '../utils/api';
import { getPageSEO, formatKeywords, generateBreadcrumbSchema, BASE_URL } from '../utils/seo';

export const AdvancedFeaturesPage: React.FC = () => {
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

      <style>{`
        .tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: #6c757d;
        }
        .tab-pill:hover {
          background: #e9ecef;
          border-color: #dee2e6;
        }
        .tab-pill.active {
          background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
          color: white;
          border-color: #0b5ed7;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }
        .tab-pill svg {
          width: 18px;
          height: 18px;
        }
        
        .content-fade {
          animation: fadeIn 0.3s ease-in-out;
        }
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

        .use-case-card {
          padding: 1.5rem;
          border-radius: 12px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          background: white;
        }
        .use-case-card:hover {
          border-color: #0d6efd;
          box-shadow: 0 4px 16px rgba(13, 110, 253, 0.1);
          transform: translateY(-2px);
        }
        .use-case-card h5 {
          color: #0d6efd;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .use-case-card p {
          color: #6c757d;
          margin: 0;
          font-size: 0.95rem;
        }

        .benefit-card {
          padding: 1.5rem;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.05) 0%, rgba(13, 110, 253, 0.02) 100%);
          border: 1px solid rgba(13, 110, 253, 0.1);
          text-align: center;
          transition: all 0.3s ease;
        }
        .benefit-card:hover {
          border-color: #0d6efd;
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
        }
        .benefit-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
        }
        .benefit-card h6 {
          font-weight: 600;
          color: #212529;
          margin-bottom: 0.25rem;
        }
        .benefit-card p {
          color: #6c757d;
          margin: 0;
          font-size: 0.9rem;
        }

        .tip-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #e7f1ff;
          border-left: 4px solid #0d6efd;
          border-radius: 0 8px 8px 0;
          margin: 0.5rem 0;
          color: #0d6efd;
          font-weight: 500;
        }

        .sticky-sidebar {
          position: sticky;
          top: 2rem;
        }

        @media (max-width: 768px) {
          .sticky-sidebar {
            position: static;
            top: auto;
            margin-top: 3rem;
          }
          .tab-pill {
            display: flex;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="container-lg py-5">
        {/* Header */}
        <div className="mb-5">
          <h1 className="display-4 fw-bold mb-2">Advanced Features</h1>
          <p className="lead text-muted">
            Unlock powerful tools for batch processing and workflow automation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-5">
          <div className="d-flex gap-3 flex-wrap">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8 col-12">
            <div className="content-fade">
              {activeTab === 'batch' && (
                <div>
                  <h3 className="mb-4">Batch Processor</h3>
                  <BatchProcessor />

                  {/* Use Cases */}
                  <div className="mt-5">
                    <h5 className="mb-3">When to Use Batch Processing</h5>
                    <div className="row">
                      {useCases.batch.map((useCase, idx) => (
                        <div key={idx} className="col-md-6 mb-3">
                          <div className="use-case-card">
                            <h5>{useCase.title}</h5>
                            <p>{useCase.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'presets' && (
                <div>
                  <h3 className="mb-4">Presets Manager</h3>
                  <PresetsManager onPresetSelect={setSelectedPreset} />

                  {/* Use Cases */}
                  <div className="mt-5">
                    <h5 className="mb-3">When to Use Presets</h5>
                    <div className="row">
                      {useCases.presets.map((useCase, idx) => (
                        <div key={idx} className="col-md-6 mb-3">
                          <div className="use-case-card">
                            <h5>{useCase.title}</h5>
                            <p>{useCase.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="col-lg-4 col-12">
            <div className="sticky-sidebar">
              {/* Tips Section */}
              <div className="mb-4">
                <h5 className="mb-3">💡 Quick Tips</h5>
                {tips[activeTab].map((tip, idx) => (
                  <div key={idx} className="tip-badge">
                    <span>✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div>
                <h5 className="mb-3">Key Benefits</h5>
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="benefit-card">
                    <div className="benefit-icon">{benefit.icon}</div>
                    <h6>{benefit.label}</h6>
                    <p>{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* Selected Preset Info */}
              {selectedPreset && (
                <div className="mt-4 p-3 bg-info bg-opacity-10 rounded-3 border border-info border-opacity-25">
                  <h6 className="text-info mb-2">✓ Preset Loaded</h6>
                  <p className="mb-1 small fw-medium">{selectedPreset.name}</p>
                  <small className="text-muted d-block">
                    {selectedPreset.sourceFormat.toUpperCase()} → {selectedPreset.targetFormat.toUpperCase()}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedFeaturesPage;
