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
    <div className="container-lg py-5">
      {/* Header */}
      <div className="mb-5">
        <h1 className="display-4 fw-bold mb-2">Advanced Features</h1>
        <p className="lead text-muted">
          Batch process multiple conversions and manage your favorite presets
        </p>
      </div>

      {/* Notification if preset selected */}
      {selectedPreset && (
        <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
          <div className="fw-medium">
            Preset Selected: <strong>{selectedPreset.name}</strong>
          </div>
          <small className="d-block mt-1">
            {selectedPreset.sourceFormat.toUpperCase()} → {selectedPreset.targetFormat.toUpperCase()}
          </small>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSelectedPreset(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.id} role="presentation">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="me-2">{tab.icon}</span>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'batch' && (
          <div className="tab-pane fade show active">
            <BatchProcessor />
            <div className="alert alert-info mt-4" role="alert">
              <h5 className="alert-heading">💡 Tip: Batch Processing</h5>
              <p className="mb-0 small">
                Add multiple items with different formats and convert them all at once. Perfect for
                processing large datasets or multiple files in different formats.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="tab-pane fade show active">
            <PresetsManager onPresetSelect={setSelectedPreset} />
            <div className="alert alert-success mt-4" role="alert">
              <h5 className="alert-heading">💡 Tip: Conversion Presets</h5>
              <p className="mb-0 small">
                Save your frequently used conversion settings as presets. Quickly access them from
                the main conversion page without having to reconfigure formats each time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feature Grid */}
      <div className="row mt-5">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div style={{ fontSize: '2rem' }} className="mb-3">⚡</div>
              <h5 className="card-title">Fast Batch Processing</h5>
              <p className="card-text small">
                Convert multiple files at once and download all results in a single JSON file.
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div style={{ fontSize: '2rem' }} className="mb-3">💾</div>
              <h5 className="card-title">Save Presets</h5>
              <p className="card-text small">
                Create and manage conversion presets for your most common transformation tasks.
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div style={{ fontSize: '2rem' }} className="mb-3">📊</div>
              <h5 className="card-title">Real-time Progress</h5>
              <p className="card-text small">
                Monitor the status of each conversion item in your batch with detailed error messages.
              </p>
            </div>
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
