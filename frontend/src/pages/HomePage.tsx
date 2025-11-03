import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { FormatSelector } from '../components/FormatSelector';
import { Button, ErrorAlert, SuccessAlert } from '../components/Common';
import type { SupportedFormat } from '../types';
import { conversionService } from '../utils/api';
import { useAppStore } from '../store/appStore';

export const HomePage: React.FC = () => {
  const [sourceFormat, setSourceFormat] = useState<SupportedFormat>('csv');
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('json');
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addToHistory } = useAppStore();

  const handleConvert = async () => {
    if (!inputData) {
      setError('Please upload or paste data to convert');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await conversionService.convert({
        data: inputData,
        sourceFormat,
        targetFormat,
      });

      if (result.success && result.data) {
        setOutputData(result.data);
        setSuccess('Conversion successful!');
        addToHistory({
          id: `${Date.now()}`,
          sourceFormat,
          targetFormat,
          timestamp: new Date(),
          status: 'success',
        });
      } else {
        setError(result.error || 'Conversion failed');
        addToHistory({
          id: `${Date.now()}`,
          sourceFormat,
          targetFormat,
          timestamp: new Date(),
          status: 'failed',
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!outputData) return;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(outputData)}`);
    element.setAttribute('download', `converted.${targetFormat}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    if (!outputData) return;
    navigator.clipboard.writeText(outputData);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Convert Your Files Instantly
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Support for CSV, JSON, XML, YAML, HTML, TSV, KML, and TXT formats
          </p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Input</h3>

            <div className="mb-4">
              <FormatSelector
                value={sourceFormat}
                onChange={setSourceFormat}
                label="Source Format"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload or Paste Data</label>
              <FileUpload onFileSelect={setInputData} />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Or paste your data:</label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Paste your data here..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConvert} loading={loading} className="flex-1">
                🔄 Convert
              </Button>
              <Button
                onClick={() => setInputData('')}
                variant="secondary"
                disabled={!inputData}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Output</h3>

            <div className="mb-4">
              <FormatSelector
                value={targetFormat}
                onChange={setTargetFormat}
                label="Target Format"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Converted Result</label>
              <textarea
                value={outputData}
                readOnly
                placeholder="Your converted data will appear here..."
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={!outputData}
                className="flex-1"
                variant="primary"
              >
                ⬇️ Download
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                disabled={!outputData}
                className="flex-1"
                variant="secondary"
              >
                📋 Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
