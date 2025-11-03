import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import AdvancedFeaturesPage from './pages/AdvancedFeaturesPage';
import { useAppStore } from './store/appStore';
import './App.css';

function App() {
  const { darkMode } = useAppStore();

  return (
    <BrowserRouter>
      <div className={`flex flex-col min-h-screen ${
        darkMode ? 'dark bg-gray-950' : 'bg-white'
      }`}>
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/advanced" element={<AdvancedFeaturesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
