import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useAppStore();
  const { isAuthenticated, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <Link 
              to="/faq" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
            >
              FAQ
            </Link>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-4 pl-4 border-l" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
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
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-300 hover:text-red-400'
                        : 'text-gray-700 hover:text-red-600'
                    }`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-300 hover:text-blue-400'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
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
            <Link 
              to="/faq" 
              className={`block py-2 font-medium transition-colors hover:text-blue-600 ${
                darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            
            {/* Mobile Auth Buttons */}
            <div className="pt-4 mt-4 border-t" style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block py-2 px-4 mb-2 rounded-lg font-medium text-center bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full py-2 px-4 text-left rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'text-gray-300 hover:text-red-400'
                        : 'text-gray-700 hover:text-red-600'
                    }`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`block py-2 px-4 mb-2 rounded-lg font-medium text-center transition-colors ${
                      darkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 px-4 rounded-lg font-medium text-center bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
