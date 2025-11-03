import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import AdvancedFeaturesPage from './pages/AdvancedFeaturesPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/advanced" element={<AdvancedFeaturesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
