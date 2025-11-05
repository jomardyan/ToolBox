import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Card, CardBody } from './Card';

interface StatCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  action?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  color = 'primary',
  action,
}) => {
  const { darkMode } = useAppStore();
  
  const colorClasses = {
    primary: {
      icon: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
      trend: 'text-primary-600 dark:text-primary-400',
    },
    success: {
      icon: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
      trend: 'text-success-600 dark:text-success-400',
    },
    warning: {
      icon: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
      trend: 'text-warning-600 dark:text-warning-400',
    },
    danger: {
      icon: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
      trend: 'text-danger-600 dark:text-danger-400',
    },
    info: {
      icon: 'bg-info-100 text-info-600 dark:bg-info-900/30 dark:text-info-400',
      trend: 'text-info-600 dark:text-info-400',
    },
  };

  return (
    <Card hover className="shadow-md">
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`p-3 rounded-xl ${colorClasses[color].icon}`}>
                {icon}
              </div>
            )}
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {title}
              </p>
              <h3 className={`text-3xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {value}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
          
          {subtitle && !trend && (
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
          
          {action && (
            <div className="ml-auto">
              {action}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
