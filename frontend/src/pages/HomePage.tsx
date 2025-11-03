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
  const { addToHistory, darkMode } = useAppStore();

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

      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Universal File Converter
            </h1>
            <p className={`text-lg md:text-xl ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Seamlessly convert between CSV, JSON, XML, YAML, and more. Fast, secure, and browser-based.
            </p>
          </div>

          {/* Alerts */}
          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
          {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* Input Section */}
            <div className={`rounded-xl overflow-hidden shadow-lg flex flex-col ${
              darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
            }`}>
              <div className={`px-6 py-4 border-b ${
                darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-500 border-gray-800' : 'bg-gradient-to-r from-blue-600 to-blue-500'
              }`}>
                <h2 className="text-xl font-bold text-white">📥 Input</h2>
              </div>
              
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <FormatSelector
                    value={sourceFormat}
                    onChange={setSourceFormat}
                    label="Source Format"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Upload or Paste Data
                  </label>
                  <FileUpload onFileSelect={setInputData} />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className={`block text-sm font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Or paste your data:
                  </label>
                  <textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Paste your data here..."
                    className={`flex-1 p-4 rounded-lg border-2 focus:outline-none focus:border-blue-500 resize-none ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{borderColor: darkMode ? '#374151' : '#e5e7eb'}}>
                  <Button 
                    onClick={handleConvert} 
                    loading={loading} 
                    className="flex-1"
                  >
                    <FaExchangeAlt /> Convert
                  </Button>
                  <Button
                    onClick={() => setInputData('')}
                    variant="secondary"
                    disabled={!inputData}
                    className="flex-1"
                  >
                    <FaTrash /> Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className={`rounded-xl overflow-hidden shadow-lg flex flex-col ${
              darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
            }`}>
              <div className={`px-6 py-4 border-b ${
                darkMode ? 'bg-gradient-to-r from-green-600 to-emerald-500 border-gray-800' : 'bg-gradient-to-r from-green-600 to-emerald-500'
              }`}>
                <h2 className="text-xl font-bold text-white">📤 Output</h2>
              </div>
              
              <div className="p-6 flex flex-col gap-4 flex-1">
                <div>
                  <FormatSelector
                    value={targetFormat}
                    onChange={setTargetFormat}
                    label="Target Format"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className={`block text-sm font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Converted Result
                  </label>
                  <textarea
                    value={outputData}
                    readOnly
                    placeholder="Your converted data will appear here..."
                    className={`flex-1 p-4 rounded-lg border-2 focus:outline-none resize-none ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-600' 
                        : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t" style={{borderColor: darkMode ? '#374151' : '#e5e7eb'}}>
                  <Button
                    onClick={handleDownload}
                    disabled={!outputData}
                    className="flex-1"
                    variant="primary"
                  >
                    <FaDownload /> Download
                  </Button>
                  <Button
                    onClick={handleCopyToClipboard}
                    disabled={!outputData}
                    className="flex-1"
                    variant="secondary"
                  >
                    <FaCopy /> Copy
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
