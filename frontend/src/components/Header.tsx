import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useAppStore();

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className={`navbar navbar-expand-lg navbar-sticky ${darkMode ? 'navbar-dark bg-dark' : 'navbar-light bg-white border-bottom'}`}>
      <div className="container-fluid">
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <span className="fs-3">📊</span>
          <div>
            <div className="fw-bold">CSV Converter</div>
            <small className={darkMode ? 'text-muted' : 'text-muted'}>Convert any format</small>
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <nav className="navbar-nav ms-auto gap-3 align-items-center">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/history" className="nav-link">
              History
            </Link>
            <Link to="/advanced" className="nav-link">
              Advanced
            </Link>
            <button
              onClick={toggleDarkMode}
              className={`btn btn-sm ${darkMode ? 'btn-light' : 'btn-dark'}`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
