import React from 'react';
import { useAppStore } from '../../store/appStore';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  gradient = false,
  glow = false,
}) => {
  const { darkMode } = useAppStore();
  
  const baseClasses = `rounded-2xl overflow-hidden transition-all duration-300`;
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  const glowClasses = glow ? 'hover:shadow-glow' : '';
  
  const bgClasses = gradient
    ? darkMode
      ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
      : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
    : darkMode
      ? 'bg-gray-900 border border-gray-800'
      : 'bg-white border border-gray-200';

  return (
    <div 
      className={`${baseClasses} ${bgClasses} ${hoverClasses} ${glowClasses} ${className}`}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '',
  gradient = false,
}) => {
  const { darkMode } = useAppStore();
  
  const bgClasses = gradient
    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
    : darkMode
      ? 'bg-gray-800 border-b border-gray-700 text-gray-100'
      : 'bg-gray-50 border-b border-gray-200 text-gray-900';

  return (
    <div className={`px-6 py-4 ${bgClasses} ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const { darkMode } = useAppStore();
  
  const borderClasses = darkMode ? 'border-t border-gray-800' : 'border-t border-gray-200';
  
  return (
    <div className={`px-6 py-4 ${borderClasses} ${className}`}>
      {children}
    </div>
  );
};
