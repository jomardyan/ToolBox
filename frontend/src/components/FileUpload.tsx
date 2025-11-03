import React, { useState, useRef } from 'react';

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
      className={`border border-2 border-dashed rounded p-5 text-center transition-all ${
        isDragging
          ? 'border-primary bg-primary bg-opacity-10'
          : 'border-secondary'
      }`}
      style={{ cursor: 'pointer' }}
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
        className="d-none"
      />
      <div className="fs-1 mb-2">📁</div>
      <h5 className="fw-semibold mb-1">Drag and drop your file</h5>
      <p className="small text-muted mb-2">or click to browse</p>
      <small className="text-muted d-block">
        Max size: {maxSize / 1024 / 1024}MB
      </small>
    </div>
  );
};
