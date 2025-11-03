import React from 'react';
import type { SupportedFormat } from '../types';

interface FormatSelectorProps {
  value: SupportedFormat;
  onChange: (format: SupportedFormat) => void;
  label?: string;
}

const FORMATS: SupportedFormat[] = ['csv', 'json', 'xml', 'yaml', 'html', 'tsv', 'kml', 'txt'];

const FORMAT_BADGES: Record<SupportedFormat, string> = {
  csv: 'primary',
  json: 'success',
  xml: 'purple',
  yaml: 'warning',
  html: 'danger',
  tsv: 'info',
  kml: 'cyan',
  txt: 'secondary',
  sql: 'pink',
  excel: 'emerald',
};

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  value,
  onChange,
  label = 'Select format',
}) => {
  return (
    <div>
      <label className="form-label fw-medium">{label}</label>
      <div className="d-flex flex-wrap gap-2">
        {FORMATS.map((format) => (
          <button
            key={format}
            onClick={() => onChange(format as SupportedFormat)}
            className={`btn btn-sm ${
              value === format
                ? `btn-${FORMAT_BADGES[format]}`
                : `btn-outline-${FORMAT_BADGES[format]}`
            }`}
          >
            {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};
