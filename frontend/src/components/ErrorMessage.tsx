import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 animate-slide-up ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-error-100 dark:bg-error-900/40 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-semibold text-error-800 dark:text-error-200">
            Произошла ошибка
          </h3>
          <p className="mt-2 text-sm text-error-700 dark:text-error-300 leading-relaxed">
            {message}
          </p>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="btn-error text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;