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
    <div className="container-lg py-5">
      <div className="text-center mb-5">
        <h2 className="display-5 fw-bold mb-3">
          Convert Your Files Instantly
        </h2>
        <p className="lead text-muted">
          Support for CSV, JSON, XML, YAML, HTML, TSV, KML, and TXT formats
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="row g-4">
        {/* Input Section */}
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Input</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <FormatSelector
                  value={sourceFormat}
                  onChange={setSourceFormat}
                  label="Source Format"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Upload or Paste Data</label>
                <FileUpload onFileSelect={setInputData} />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Or paste your data:</label>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Paste your data here..."
                  className="form-control"
                  style={{ minHeight: '150px' }}
                />
              </div>

              <div className="d-grid gap-2 d-sm-flex">
                <Button onClick={handleConvert} loading={loading} className="flex-sm-grow-1">
                  🔄 Convert
                </Button>
                <Button
                  onClick={() => setInputData('')}
                  variant="secondary"
                  disabled={!inputData}
                  className="flex-sm-grow-1"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Output</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <FormatSelector
                  value={targetFormat}
                  onChange={setTargetFormat}
                  label="Target Format"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Converted Result</label>
                <textarea
                  value={outputData}
                  readOnly
                  placeholder="Your converted data will appear here..."
                  className="form-control bg-light"
                  style={{ minHeight: '150px' }}
                />
              </div>

              <div className="d-grid gap-2 d-sm-flex">
                <Button
                  onClick={handleDownload}
                  disabled={!outputData}
                  className="flex-sm-grow-1"
                  variant="primary"
                >
                  ⬇️ Download
                </Button>
                <Button
                  onClick={handleCopyToClipboard}
                  disabled={!outputData}
                  className="flex-sm-grow-1"
                  variant="secondary"
                >
                  📋 Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
