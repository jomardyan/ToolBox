import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/appStore';

interface FileUploadProps {
  onFileSelect: (content: string) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '*',
  maxSize = 100 * 1024 * 1024, // 100MB default
}) => {
  const { darkMode } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(content);
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragging
          ? darkMode
            ? 'border-blue-400 bg-blue-900/30 shadow-md'
            : 'border-blue-500 bg-blue-50 shadow-md'
          : darkMode
            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        className="hidden"
      />
      <div className="text-5xl mb-3">📁</div>
      <h5 className={`font-semibold text-lg mb-2 ${
        darkMode ? 'text-gray-100' : 'text-gray-800'
      }`}>Drag and drop your file</h5>
      <p className={`text-sm mb-2 ${
        darkMode ? 'text-gray-400' : 'text-gray-500'
      }`}>or click to browse your computer</p>
      <small className={`block ${
        darkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        Max size: {maxSize / 1024 / 1024}MB
      </small>
    </div>
  );
};
