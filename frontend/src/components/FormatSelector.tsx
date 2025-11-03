import React from 'react';
import type { SupportedFormat } from '../types';

interface FormatSelectorProps {
  value: SupportedFormat;
  onChange: (format: SupportedFormat) => void;
  label?: string;
}

const FORMATS: SupportedFormat[] = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];

const FORMAT_COLORS: Record<SupportedFormat, string> = {
  csv: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  json: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
  xml: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  yaml: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
  html: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
  tsv: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
  kml: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
  txt: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600',
  sql: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
  excel: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
};

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  value,
  onChange,
  label = 'Select format',
}) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
        {FORMATS.map((format) => (
          <button
            key={format}
            onClick={() => onChange(format as SupportedFormat)}
            className={`py-2 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
              value === format
                ? `${FORMAT_COLORS[format]} border-current shadow-lg scale-105`
                : `${FORMAT_COLORS[format]} opacity-60 hover:opacity-100`
            }`}
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};
