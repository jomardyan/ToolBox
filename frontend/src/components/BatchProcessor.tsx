import React, { useState } from 'react';
import { conversionService } from '../utils/api';
import type { BatchConversionRequest } from '../utils/api';
import { Button } from './Common';
import type { SupportedFormat } from '../types';

interface BatchItem {
  id: string;
  data: string;
  sourceFormat: SupportedFormat;
  targetFormat: SupportedFormat;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: string;
  error?: string;
}

export const BatchProcessor: React.FC = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItemData, setNewItemData] = useState('');
  const [newItemSourceFormat, setNewItemSourceFormat] = useState<SupportedFormat>('csv');
  const [newItemTargetFormat, setNewItemTargetFormat] = useState<SupportedFormat>('json');

  const FORMATS: SupportedFormat[] = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];

  const addItem = () => {
    if (!newItemData.trim()) {
      alert('Please enter data for the conversion item');
      return;
    }

    const newItem: BatchItem = {
      id: Date.now().toString(),
      data: newItemData,
      sourceFormat: newItemSourceFormat,
      targetFormat: newItemTargetFormat,
      status: 'pending',
    };

    setItems([...items, newItem]);
    setNewItemData('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const processBatch = async () => {
    if (items.length === 0) {
      alert('Add at least one item to process');
      return;
    }

    setLoading(true);

    // Update all items to processing state
    setItems(prev =>
      prev.map(item => ({ ...item, status: 'processing' as const }))
    );

    const batchRequest: BatchConversionRequest = {
      items: items.map(item => ({
        data: item.data,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
      })),
    };

    const result = await conversionService.batchConvert(batchRequest);
    setLoading(false);

    if (result.success) {
      setItems(prev =>
        prev.map((item, index) => {
          const resultItem = result.data.results[index];
          return {
            ...item,
            status: resultItem.success ? ('success' as const) : ('error' as const),
            result: resultItem.data,
            error: resultItem.error,
          };
        })
      );
    } else {
      setItems(prev =>
        prev.map(item => ({
          ...item,
          status: 'error' as const,
          error: result.error || 'Batch processing failed',
        }))
      );
    }
  };

  const clearResults = () => {
    setItems([]);
  };

  const downloadResults = () => {
    if (items.length === 0) return;

    const results = items
      .filter(item => item.status === 'success')
      .map(item => ({
        id: item.id,
        sourceFormat: item.sourceFormat,
        targetFormat: item.targetFormat,
        result: item.result,
      }));

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Batch Processor</h2>

      {/* Add Item Form */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Conversion Item</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data to Convert
          </label>
          <textarea
            value={newItemData}
            onChange={e => setNewItemData(e.target.value)}
            placeholder="Paste your data here..."
            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Format
            </label>
            <select
              value={newItemSourceFormat}
              onChange={e => setNewItemSourceFormat(e.target.value as SupportedFormat)}
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
              value={newItemTargetFormat}
              onChange={e => setNewItemTargetFormat(e.target.value as SupportedFormat)}
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

        <Button onClick={addItem} variant="primary">
          Add Item to Batch
        </Button>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Queued Items ({items.length})
            </h3>
            <div className="space-x-2">
              <Button
                onClick={processBatch}
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Process Batch'}
              </Button>
              <Button
                onClick={downloadResults}
                variant="secondary"
                disabled={items.filter(i => i.status === 'success').length === 0}
              >
                Download Results
              </Button>
              <Button
                onClick={clearResults}
                variant="secondary"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded border-l-4 ${
                  item.status === 'pending'
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-700'
                    : item.status === 'processing'
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900'
                      : item.status === 'success'
                        ? 'border-green-400 bg-green-50 dark:bg-green-900'
                        : 'border-red-400 bg-red-50 dark:bg-red-900'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Item {index + 1}: {item.sourceFormat.toUpperCase()} → {item.targetFormat.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {item.data.substring(0, 60)}...
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Error: {item.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {item.status.toUpperCase()}
                    </span>
                    {item.status === 'pending' && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No items queued. Add items above to get started.</p>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
