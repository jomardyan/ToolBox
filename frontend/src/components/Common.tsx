import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" 
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
};

interface AlertProps {
  message: string;
  onDismiss?: () => void;
  type: 'danger' | 'success';
}

const alertVariants = {
  danger: 'bg-red-50 border border-red-200 text-red-800',
  success: 'bg-green-50 border border-green-200 text-green-800',
};

export const Alert: React.FC<AlertProps> = ({ message, onDismiss, type }) => {
  return (
    <div 
      className={`${alertVariants[type]} rounded-lg p-4 mb-4 flex items-start justify-between animate-in fade-in slide-in-from-top-2 duration-300`} 
      role="alert"
    >
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="danger" />
);

export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert {...props} type="success" />
);

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  loading?: boolean;
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-400 hover:bg-gray-500 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  info: 'bg-cyan-500 hover:bg-cyan-600 text-white',
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  className = '',
  children,
  variant = 'primary',
  loading = false,
}) => {
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  const variantClass = buttonVariants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantClass} ${disabledClass} font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? <Loading message="" /> : children}
    </button>
  );
};
