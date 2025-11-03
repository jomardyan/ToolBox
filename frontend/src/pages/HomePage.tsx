import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileUpload } from '../components/FileUpload';
import { FormatSelector } from '../components/FormatSelector';
import { Button, ErrorAlert, SuccessAlert } from '../components/Common';
import type { SupportedFormat } from '../types';
import { conversionService } from '../utils/api';
import { useAppStore } from '../store/appStore';
import { FaExchangeAlt, FaTrash, FaDownload, FaCopy } from 'react-icons/fa';
import {
  getPageSEO,
  formatKeywords,
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
  BASE_URL,
} from '../utils/seo';

export const HomePage: React.FC = () => {
  const pageSEO = getPageSEO('home');
  const softwareSchema = generateSoftwareApplicationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'File Converter', url: BASE_URL },
  ]);
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
    <>
      <Helmet>
        <title>{pageSEO.title}</title>
        <meta name="description" content={pageSEO.description} />
        <meta name="keywords" content={formatKeywords(pageSEO.keywords)} />
        <link rel="canonical" href={pageSEO.canonical} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={pageSEO.ogType} />
        <meta property="og:url" content={pageSEO.canonical} />
        <meta property="og:title" content={pageSEO.title} />
        <meta property="og:description" content={pageSEO.description} />
        <meta property="og:image" content={pageSEO.ogImage} />
        
        {/* Twitter */}
        <meta name="twitter:card" content={pageSEO.twitterCard} />
        <meta name="twitter:url" content={pageSEO.canonical} />
        <meta name="twitter:title" content={pageSEO.title} />
        <meta name="twitter:description" content={pageSEO.description} />
        <meta name="twitter:image" content={pageSEO.ogImage} />
        
        {/* Structured Data - SoftwareApplication */}
        <script type="application/ld+json">
          {JSON.stringify(softwareSchema)}
        </script>
        
        {/* Structured Data - Breadcrumb */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container-lg py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">Universal File Converter</h1>
          <p className="lead text-muted">
            Seamlessly convert between CSV, JSON, XML, YAML, and more.
          </p>
        </div>

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
        {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="row g-4">
        {/* Input Section */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Input</h5>
            </div>
            <div className="card-body d-flex flex-column">
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

              <div className="mb-3 flex-grow-1">
                <label className="form-label fw-medium">Or paste your data:</label>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Paste your data here..."
                  className="form-control h-100"
                  style={{ minHeight: '150px' }}
                />
              </div>

              <div className="d-grid gap-2 d-sm-flex mt-auto">
                <Button onClick={handleConvert} loading={loading} className="flex-sm-grow-1">
                  <FaExchangeAlt className="me-2" /> Convert
                </Button>
                <Button
                  onClick={() => setInputData('')}
                  variant="secondary"
                  disabled={!inputData}
                  className="flex-sm-grow-1"
                >
                  <FaTrash className="me-2" /> Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Output</h5>
            </div>
            <div className="card-body d-flex flex-column">
              <div className="mb-3">
                <FormatSelector
                  value={targetFormat}
                  onChange={setTargetFormat}
                  label="Target Format"
                />
              </div>

              <div className="mb-3 flex-grow-1">
                <label className="form-label fw-medium">Converted Result</label>
                <textarea
                  value={outputData}
                  readOnly
                  placeholder="Your converted data will appear here..."
                  className="form-control bg-light h-100"
                  style={{ minHeight: '150px' }}
                />
              </div>

              <div className="d-grid gap-2 d-sm-flex mt-auto">
                <Button
                  onClick={handleDownload}
                  disabled={!outputData}
                  className="flex-sm-grow-1"
                  variant="primary"
                >
                  <FaDownload className="me-2" /> Download
                </Button>
                <Button
                  onClick={handleCopyToClipboard}
                  disabled={!outputData}
                  className="flex-sm-grow-1"
                  variant="secondary"
                >
                  <FaCopy className="me-2" /> Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
