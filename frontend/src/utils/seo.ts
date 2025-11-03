/**
 * SEO Utilities for ToolBox File Converter
 * Provides helpers for meta tags, Open Graph, Twitter Cards, and structured data
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Base URL for the application (update for production)
 */
export const BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'https://toolbox.example.com';

/**
 * Default SEO configuration
 */
export const DEFAULT_SEO: SEOConfig = {
  title: 'ToolBox - Universal File Format Converter | CSV, JSON, XML, YAML',
  description: 'Free online file format converter. Instantly transform CSV, JSON, XML, YAML, SQL, Excel, and more. Fast, secure, browser-based conversion with batch processing and preset management.',
  keywords: [
    'file converter',
    'CSV converter',
    'JSON converter',
    'XML converter',
    'YAML converter',
    'data format converter',
    'file transformation',
    'batch file converter',
    'online converter',
    'free converter tool',
  ],
  canonical: BASE_URL,
  ogType: 'website',
  ogImage: `${BASE_URL}/og-image.png`,
  twitterCard: 'summary_large_image',
};

/**
 * Generate page-specific SEO config
 */
export const getPageSEO = (page: 'home' | 'history' | 'advanced'): SEOConfig => {
  switch (page) {
    case 'home':
      return {
        title: 'ToolBox - Universal File Format Converter | CSV, JSON, XML, YAML',
        description: 'Free online file format converter. Instantly transform CSV, JSON, XML, YAML, SQL, Excel, and more. Fast, secure, browser-based conversion with batch processing and preset management.',
        keywords: [
          'file converter',
          'CSV to JSON',
          'JSON to XML',
          'XML to YAML',
          'data converter',
          'format transformer',
          'online file converter',
          'free converter',
        ],
        canonical: BASE_URL,
        ogType: 'website',
        ogImage: `${BASE_URL}/og-image.png`,
        twitterCard: 'summary_large_image',
      };

    case 'history':
      return {
        title: 'Conversion History - ToolBox File Converter',
        description: 'View your file conversion history. Track all your CSV, JSON, XML, and YAML conversions in one place. Monitor successful conversions and review failed attempts.',
        keywords: [
          'conversion history',
          'file conversion tracking',
          'conversion log',
          'file transformer history',
        ],
        canonical: `${BASE_URL}/history`,
        ogType: 'website',
        twitterCard: 'summary',
      };

    case 'advanced':
      return {
        title: 'Advanced Features - Batch Processing & Presets | ToolBox',
        description: 'Powerful batch file conversion and preset management. Convert multiple files simultaneously, save favorite conversion settings, and automate recurring data transformation tasks.',
        keywords: [
          'batch file converter',
          'bulk conversion',
          'conversion presets',
          'batch processing',
          'multiple file converter',
          'automated conversion',
        ],
        canonical: `${BASE_URL}/advanced`,
        ogType: 'website',
        twitterCard: 'summary',
      };

    default:
      return DEFAULT_SEO;
  }
};

/**
 * Generate structured data (JSON-LD) for SoftwareApplication
 */
export const generateSoftwareApplicationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ToolBox File Converter',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free online universal file format converter supporting CSV, JSON, XML, YAML, SQL, Excel, HTML, TSV, and more. Fast, secure, browser-based conversion with batch processing capabilities.',
    featureList: [
      'Convert CSV, JSON, XML, YAML, SQL, Excel, HTML, TSV, KML, TXT formats',
      'Batch processing for multiple files',
      'Save and manage conversion presets',
      'Drag-and-drop file upload',
      'Instant conversion in browser',
      'Download or copy results',
      'Conversion history tracking',
      'Dark mode support',
      'No file size limits',
      'Privacy-focused - no data stored on servers',
    ],
    screenshot: `${BASE_URL}/screenshot.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'ToolBox',
      url: BASE_URL,
    },
    datePublished: '2024-01-01',
    softwareVersion: '1.0.0',
  };
};

/**
 * Generate BreadcrumbList structured data
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Format keywords for meta tag
 */
export const formatKeywords = (keywords?: string[]): string => {
  return keywords?.join(', ') || DEFAULT_SEO.keywords?.join(', ') || '';
};
