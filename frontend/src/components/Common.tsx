import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="spinner-border spinner-border-sm text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="small text-muted">{message}</span>
    </div>
  );
};

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
      <div>{message}</div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          aria-label="Close"
        ></button>
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
    <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
      <div>{message}</div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
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
  const btnClass = `btn btn-${variant}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${btnClass} ${className}`}
    >
      {loading ? <Loading message="" /> : children}
    </button>
  );
};
