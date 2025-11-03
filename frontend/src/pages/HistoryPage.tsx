import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Common';
import { getPageSEO, formatKeywords, generateBreadcrumbSchema, BASE_URL } from '../utils/seo';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory, darkMode } = useAppStore();
  const pageSEO = getPageSEO('history');
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'History', url: `${BASE_URL}/history` },
  ]);

  if (history.length === 0) {
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
          
          <meta name="robots" content="noindex, follow" />
          
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        </Helmet>
        
        <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className={`text-4xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversion History
            </h2>
            <div className={`rounded-xl shadow-md border ${
              darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="p-12 text-center">
                <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No conversions yet
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Your conversion history will appear here once you perform a conversion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        
        <meta name="robots" content="noindex, follow" />
        
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Conversion History
            </h2>
            <Button 
              onClick={clearHistory} 
              variant="danger"
              className="w-full sm:w-auto"
            >
              🗑️ Clear All
            </Button>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border-2 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md ${
                  darkMode 
                    ? 'bg-gray-900 border-gray-800 hover:border-blue-500' 
                    : 'bg-white border-gray-200 hover:border-blue-400'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold text-sm uppercase px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-blue-900 text-blue-200' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.sourceFormat}
                    </span>
                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>→</span>
                    <span className={`font-bold text-sm uppercase px-3 py-1 rounded-full ${
                      darkMode 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.targetFormat}
                    </span>
                  </div>
                  <small className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                    {new Date(item.timestamp).toLocaleString()}
                  </small>
                </div>
                <div>
                  <span
                    className={`font-semibold px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                      item.status === 'success'
                        ? darkMode 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-green-100 text-green-800'
                        : darkMode 
                          ? 'bg-red-900 text-red-200' 
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.status === 'success' ? '✓ Success' : '✗ Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
