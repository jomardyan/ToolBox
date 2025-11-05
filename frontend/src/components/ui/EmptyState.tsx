import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  const { darkMode } = useAppStore();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className={`text-6xl mb-4 ${darkMode ? 'opacity-50' : 'opacity-30'}`}>
          {icon}
        </div>
      )}
      <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-sm mb-6 text-center max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
};
