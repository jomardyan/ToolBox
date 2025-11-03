import React from 'react';
import { useAppStore } from '../store/appStore';
import type { SupportedFormat } from '../types';

interface FormatSelectorProps {
  value: SupportedFormat;
  onChange: (format: SupportedFormat) => void;
  label?: string;
}

const FORMATS: SupportedFormat[] = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];

const FORMAT_COLORS: Record<SupportedFormat, { bg: string; text: string; hoverBg: string; border: string }> = {
  csv: { bg: 'bg-blue-100', text: 'text-blue-800', hoverBg: 'hover:bg-blue-200', border: 'border-blue-300' },
  json: { bg: 'bg-green-100', text: 'text-green-800', hoverBg: 'hover:bg-green-200', border: 'border-green-300' },
  xml: { bg: 'bg-purple-100', text: 'text-purple-800', hoverBg: 'hover:bg-purple-200', border: 'border-purple-300' },
  yaml: { bg: 'bg-amber-100', text: 'text-amber-800', hoverBg: 'hover:bg-amber-200', border: 'border-amber-300' },
  html: { bg: 'bg-red-100', text: 'text-red-800', hoverBg: 'hover:bg-red-200', border: 'border-red-300' },
  tsv: { bg: 'bg-cyan-100', text: 'text-cyan-800', hoverBg: 'hover:bg-cyan-200', border: 'border-cyan-300' },
  kml: { bg: 'bg-sky-100', text: 'text-sky-800', hoverBg: 'hover:bg-sky-200', border: 'border-sky-300' },
  txt: { bg: 'bg-gray-100', text: 'text-gray-800', hoverBg: 'hover:bg-gray-200', border: 'border-gray-300' },
  sql: { bg: 'bg-pink-100', text: 'text-pink-800', hoverBg: 'hover:bg-pink-200', border: 'border-pink-300' },
  excel: { bg: 'bg-emerald-100', text: 'text-emerald-800', hoverBg: 'hover:bg-emerald-200', border: 'border-emerald-300' },
};

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  value,
  onChange,
  label = 'Select format',
}) => {
  const { darkMode } = useAppStore();
  
  return (
    <div>
      <label className={`block text-sm font-semibold mb-3 ${
        darkMode ? 'text-gray-200' : 'text-gray-700'
      }`}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {FORMATS.map((format) => {
          const colors = FORMAT_COLORS[format];
          const isSelected = value === format;
          return (
            <button
              key={format}
              onClick={() => onChange(format as SupportedFormat)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                isSelected
                  ? darkMode
                    ? `bg-gray-700 border-2 text-white border-gray-600 shadow-md`
                    : `${colors.bg} ${colors.text} border-2 ${colors.border} shadow-md`
                  : darkMode
                    ? `border-2 border-gray-600 text-gray-200 hover:border-gray-500 hover:bg-gray-800`
                    : `border-2 ${colors.border} ${colors.text} hover:${colors.bg} ${colors.hoverBg}`
              }`}
            >
              {format.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
