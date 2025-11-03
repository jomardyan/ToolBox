import React, { useState, useEffect } from 'react';
import { conversionService } from '../utils/api';
import type { ConversionPreset } from '../utils/api';
import { Button } from './Common';
import type { SupportedFormat } from '../types';

interface PresetsProps {
  onPresetSelect?: (preset: ConversionPreset) => void;
}

export const PresetsManager: React.FC<PresetsProps> = ({ onPresetSelect }) => {
  const [presets, setPresets] = useState<ConversionPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetSourceFormat, setNewPresetSourceFormat] = useState<SupportedFormat>('csv');
  const [newPresetTargetFormat, setNewPresetTargetFormat] = useState<SupportedFormat>('json');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const FORMATS: SupportedFormat[] = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setLoading(true);
    const data = await conversionService.getPresets();
    setPresets(data);
    setLoading(false);
  };

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const result = await conversionService.savePreset(
      newPresetName,
      newPresetSourceFormat,
      newPresetTargetFormat,
      newPresetDescription
    );

    if (result.success) {
      setPresets([...presets, result.data]);
      setNewPresetName('');
      setNewPresetDescription('');
      setShowForm(false);
    } else {
      alert('Failed to save preset: ' + result.error);
    }
  };

  const handleUsePreset = (preset: ConversionPreset) => {
    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  const handleDeletePreset = (id: string) => {
    // In a real app, this would call a delete endpoint
    setPresets(presets.filter(p => p.id !== id));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Presets</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="primary"
        >
          {showForm ? 'Cancel' : 'New Preset'}
        </Button>
      </div>

      {/* New Preset Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Create New Preset</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preset Name
            </label>
            <input
              type="text"
              value={newPresetName}
              onChange={e => setNewPresetName(e.target.value)}
              placeholder="e.g., CSV to JSON"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newPresetDescription}
              onChange={e => setNewPresetDescription(e.target.value)}
              placeholder="Optional description of this preset"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Format
              </label>
              <select
                value={newPresetSourceFormat}
                onChange={e => setNewPresetSourceFormat(e.target.value as SupportedFormat)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded"
              >
                {FORMATS.map(fmt => (
                  <option key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Format
              </label>
              <select
                value={newPresetTargetFormat}
                onChange={e => setNewPresetTargetFormat(e.target.value as SupportedFormat)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded"
              >
                {FORMATS.map(fmt => (
                  <option key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleSavePreset}
              variant="primary"
            >
              Save Preset
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Presets List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Loading presets...
        </div>
      ) : presets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map(preset => (
            <div
              key={preset.id}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {preset.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {preset.description || 'No description'}
              </p>
              <div className="mb-3 text-sm">
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded mr-2">
                  {preset.sourceFormat.toUpperCase()}
                </span>
                <span className="inline-block px-1">→</span>
                <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded ml-2">
                  {preset.targetFormat.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleUsePreset(preset)}
                  variant="primary"
                  className="text-sm flex-1"
                >
                  Use
                </Button>
                <Button
                  onClick={() => handleDeletePreset(preset.id)}
                  variant="secondary"
                  className="text-sm flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No presets yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PresetsManager;
