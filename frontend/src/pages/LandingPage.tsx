import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { FaCheck, FaRocket, FaCode, FaShieldAlt, FaBolt, FaChartLine, FaHeadset, FaArrowRight } from 'react-icons/fa';

export const LandingPage: React.FC = () => {
  const { darkMode } = useAppStore();

  const pricingTiers = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for developers and small projects',
      features: [
        '1,000 API calls/month',
        '10 MB file size limit',
        'Basic conversion operations',
        'Community support',
        '10 requests/minute',
        'API documentation',
      ],
      cta: 'Get Started',
      ctaLink: '/register',
      highlighted: false,
      badge: null,
    },
    {
      name: 'Starter',
      price: 29,
      period: 'month',
      description: 'For small businesses and indie developers',
      features: [
        '50,000 API calls/month',
        '50 MB file size limit',
        'All conversion formats',
        'Email support (48h)',
        '30 requests/minute',
        '5 API keys',
        'Basic analytics dashboard',
        '99.5% uptime SLA',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/register',
      highlighted: false,
      badge: null,
    },
    {
      name: 'Professional',
      price: 99,
      period: 'month',
      description: 'For growing businesses and agencies',
      features: [
        '250,000 API calls/month',
        '100 MB file size limit',
        'All conversion formats',
        'Priority email support (24h)',
        '60 requests/minute',
        '20 API keys',
        'Advanced analytics',
        'Webhook notifications',
        '99.9% uptime SLA',
        'Custom rate limits',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/register',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Business',
      price: 299,
      period: 'month',
      description: 'For large enterprises and high-volume users',
      features: [
        '1,000,000 API calls/month',
        '500 MB file size limit',
        'All conversion formats',
        'Priority support (4h)',
        '120 requests/minute',
        'Unlimited API keys',
        'Advanced analytics & reporting',
        'Webhook notifications',
        'Dedicated account manager',
        '99.95% uptime SLA',
        'Custom integrations',
        'IP whitelisting',
      ],
      cta: 'Start Free Trial',
      ctaLink: '/register',
      highlighted: false,
      badge: null,
    },
  ];

  const features = [
    {
      icon: <FaCode className="text-4xl" />,
      title: 'Developer-First API',
      description: 'Clean, intuitive REST API with comprehensive documentation and code examples in multiple languages.',
    },
    {
      icon: <FaBolt className="text-4xl" />,
      title: 'Lightning Fast',
      description: 'Optimized infrastructure delivering responses in milliseconds. Built for performance at scale.',
    },
    {
      icon: <FaShieldAlt className="text-4xl" />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SOC 2 compliant, with IP whitelisting and custom security options.',
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: 'Advanced Analytics',
      description: 'Real-time usage metrics, performance monitoring, and detailed reporting dashboards.',
    },
    {
      icon: <FaHeadset className="text-4xl" />,
      title: 'World-Class Support',
      description: 'Dedicated support team with fast response times. Priority support for business plans.',
    },
    {
      icon: <FaRocket className="text-4xl" />,
      title: '99.9% Uptime SLA',
      description: 'Reliable infrastructure with guaranteed uptime and automatic failover protection.',
    },
  ];

  const stats = [
    { value: '10M+', label: 'API Calls/Month' },
    { value: '5,000+', label: 'Active Developers' },
    { value: '99.9%', label: 'Uptime' },
    { value: '<100ms', label: 'Avg Response Time' },
  ];

  return (
    <>
      <Helmet>
        <title>Data Conversion API - Modern, Fast & Reliable | ToolBox</title>
        <meta name="description" content="The modern, developer-first API for data conversion and transformation. Convert CSV, JSON, XML, YAML and more. Built for speed, reliability, and ease of integration." />
      </Helmet>

      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
        {/* Hero Section */}
        <section className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, ${darkMode ? '#334155' : '#cbd5e1'} 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8 animate-fade-in-up">
                <FaRocket />
                <span>Trusted by 5,000+ developers worldwide</span>
              </div>
              
              <h1 className={`text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode 
                  ? 'from-blue-400 via-purple-400 to-pink-400' 
                  : 'from-blue-600 via-purple-600 to-pink-600'
              }`}>
                The Modern API for<br />Data Conversion
              </h1>
              
              <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Convert between CSV, JSON, XML, YAML, and more with a single API call. 
                Built for developers who demand speed, reliability, and simplicity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Start Free Trial <FaArrowRight />
                </Link>
                <Link
                  to="/api-docs"
                  className={`inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-lg border-2 transition-all duration-200 ${
                    darkMode 
                      ? 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  View Documentation
                </Link>
              </div>
              
              <div className={`inline-flex items-center gap-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex items-center gap-2">
                  <FaCheck className="text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheck className="text-green-500" />
                  <span>1,000 free calls/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCheck className="text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-16 ${darkMode ? 'bg-gray-900 border-y border-gray-800' : 'bg-gray-50 border-y border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${
                    darkMode 
                      ? 'from-blue-400 to-purple-400' 
                      : 'from-blue-600 to-purple-600'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Built for Modern Development
              </h2>
              <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Everything you need to integrate data conversion into your applications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                    darkMode 
                      ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' 
                      : 'bg-white border border-gray-200 hover:border-gray-300 shadow-lg'
                  }`}
                >
                  <div className={`mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Simple, Transparent Pricing
              </h2>
              <p className={`text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Start free, scale as you grow. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    tier.highlighted
                      ? `transform scale-105 ${darkMode ? 'bg-gradient-to-br from-blue-900 to-purple-900 border-2 border-blue-500' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-2xl'}`
                      : `${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-lg'}`
                  } hover:-translate-y-2 hover:shadow-2xl`}
                >
                  {tier.badge && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {tier.badge}
                    </div>
                  )}
                  
                  <div className="p-8">
                    <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tier.name}
                    </h3>
                    <div className="mb-4">
                      <span className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        ${tier.price}
                      </span>
                      <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        /{tier.period}
                      </span>
                    </div>
                    <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tier.description}
                    </p>
                    
                    <Link
                      to={tier.ctaLink}
                      className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 mb-6 ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-1'
                          : darkMode
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {tier.cta}
                    </Link>
                    
                    <ul className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className={`flex items-start gap-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className={`text-lg mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Need custom volume or on-premise deployment?
              </p>
              <Link
                to="/contact"
                className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg border-2 transition-all duration-200 ${
                  darkMode 
                    ? 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                Contact Sales for Enterprise
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 ${darkMode ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900' : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of developers building with our API. Start converting data in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Free Trial <FaArrowRight />
              </Link>
              <Link
                to="/api-docs"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-all duration-200"
              >
                View API Docs
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className={`py-16 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className={`text-sm font-semibold mb-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                TRUSTED BY DEVELOPERS AT
              </p>
              <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
                <div className={`text-2xl font-bold ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>Company A</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>Company B</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>Company C</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>Company D</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
