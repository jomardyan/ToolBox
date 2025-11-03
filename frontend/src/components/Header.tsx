import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors ${
      darkMode 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl">📊</span>
            <div>
              <div className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ToolBox
              </div>
              <small className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Convert any format
              </small>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/history" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
            >
              History
            </Link>
            <Link 
              to="/advanced" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
            >
              Advanced
            </Link>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className={`md:hidden pb-4 border-t ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <Link 
              to="/" 
              className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/history" 
              className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              History
            </Link>
            <Link 
              to="/advanced" 
              className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Advanced
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};
