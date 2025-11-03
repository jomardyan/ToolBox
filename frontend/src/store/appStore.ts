import { create } from 'zustand';
import type { ConversionHistory } from '../types';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  history: ConversionHistory[];
  addToHistory: (item: ConversionHistory) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>((set) => {
  const isDark = localStorage.getItem('darkMode') === 'true';
  
  return {
    darkMode: isDark,
    toggleDarkMode: () => {
      set((state) => {
        const newMode = !state.darkMode;
        localStorage.setItem('darkMode', String(newMode));
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
