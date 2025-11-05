import { create } from 'zustand';
import type { ConversionHistory } from '../types';
import { initializeDarkMode, toggleDarkMode as toggleDM } from '../utils/darkMode';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  history: ConversionHistory[];
  addToHistory: (item: ConversionHistory) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>((set) => {
  // Initialize dark mode using centralized utility
  const isDark = initializeDarkMode();
  
  return {
    darkMode: isDark,
    toggleDarkMode: () => {
      set((state) => {
        // Use centralized toggle function
        const newMode = toggleDM(state.darkMode);
        return { darkMode: newMode };
      });
    },
    history: JSON.parse(localStorage.getItem('conversionHistory') || '[]'),
    addToHistory: (item: ConversionHistory) => {
      set((state) => {
        const newHistory = [item, ...state.history].slice(0, 50); // Keep last 50
        localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
        return { history: newHistory };
      });
    },
    clearHistory: () => {
      set(() => {
        localStorage.removeItem('conversionHistory');
        return { history: [] };
      });
    },
  };
});
