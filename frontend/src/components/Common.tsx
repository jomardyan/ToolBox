import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex align-items-center gap-2">
      <div className="spinner-border spinner-border-sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <span className="small">{message}</span>}
    </div>
  );
};

interface AlertProps {
  message: string;
  onDismiss?: () => void;
  type: 'danger' | 'success';
}

export const Alert: React.FC<AlertProps> = ({ message, onDismiss, type }) => {
  return (
    <div className={`alert alert-${type} alert-dismissible fade show mb-4`} role="alert">
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
      className={`${btnClass} ${className} d-flex align-items-center justify-content-center`}
    >
      {loading ? <Loading message="" /> : children}
    </button>
  );
};
