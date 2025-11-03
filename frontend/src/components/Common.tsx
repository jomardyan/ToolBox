import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex justify-between items-start">
      <div className="text-red-800 dark:text-red-200 text-sm">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
};

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4 flex justify-between items-start">
      <div className="text-green-800 dark:text-green-200 text-sm">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-lg leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
};

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  className = '',
  children,
  variant = 'primary',
  loading = false,
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium focus:outline-none transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300 disabled:cursor-not-allowed',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white disabled:opacity-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300 disabled:cursor-not-allowed',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? <Loading message="" /> : children}
    </button>
  );
};
