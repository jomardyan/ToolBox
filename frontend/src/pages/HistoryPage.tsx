import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/Common';
import { getPageSEO, formatKeywords, generateBreadcrumbSchema, BASE_URL } from '../utils/seo';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory } = useAppStore();
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
        
        <div className="container py-5">
          <h2 className="display-6 fw-bold mb-5">Conversion History</h2>
        <div className="card text-center shadow-sm">
          <div className="card-body p-5">
            <p className="lead text-muted">No conversions yet</p>
            <p className="small text-muted mt-2">
              Your conversion history will appear here
            </p>
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
      
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="display-6 fw-bold">Conversion History</h2>
        <Button onClick={clearHistory} variant="danger" className="btn-sm">
          🗑️ Clear All
        </Button>
      </div>

      <div className="list-group">
        {history.map((item) => (
          <div
            key={item.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold text-uppercase small">
                  {item.sourceFormat}
                </span>
                <span className="text-muted">→</span>
                <span className="fw-semibold text-uppercase small">
                  {item.targetFormat}
                </span>
              </div>
              <small className="text-muted">
                {new Date(item.timestamp).toLocaleString()}
              </small>
            </div>
            <div>
              <span
                className={`badge ${
                  item.status === 'success'
                    ? 'bg-success'
                    : 'bg-danger'
                }`}
              >
                {item.status === 'success' ? '✓ Success' : '✗ Failed'}
              </span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
};
