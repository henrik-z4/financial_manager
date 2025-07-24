import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message = 'Загрузка...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 ${sizeClasses[size]}`}></div>
        <div className={`animate-spin rounded-full border-2 border-transparent border-t-primary-600 dark:border-t-primary-400 absolute top-0 left-0 ${sizeClasses[size]}`}></div>
      </div>
      {message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;