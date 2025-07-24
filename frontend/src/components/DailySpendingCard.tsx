import React, { useState } from 'react';
import { useDailyBudget, useAdjustDailyBudget } from '../hooks/useBudget';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface DailySpendingCardProps {
  month?: number;
  year?: number;
}

const DailySpendingCard: React.FC<DailySpendingCardProps> = ({ month, year }) => {
  const { data: dailyBudget, loading, error, refetch } = useDailyBudget(month, year);
  const { mutate: adjustBudget, loading: adjusting } = useAdjustDailyBudget();
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAdjustment = async () => {
    if (!dailyBudget || !adjustmentValue) return;
    
    const adjustment = parseFloat(adjustmentValue);
    if (isNaN(adjustment)) return;

    try {
      await adjustBudget({
        month: dailyBudget.month,
        year: dailyBudget.year,
        adjustment
      });
      setShowAdjustment(false);
      setAdjustmentValue('');
      refetch();
    } catch (error) {
      console.error('Error adjusting budget:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="md" message="Загрузка дневного бюджета..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!dailyBudget) {
    return (
      <div className="card p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">Нет данных о дневном бюджете</p>
      </div>
    );
  }

  const isOverBudget = dailyBudget.remainingBudget < 0;
  const hasAdjustment = dailyBudget.automaticAdjustment !== 0;

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-warning rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Дневные расходы</h2>
        </div>
        {dailyBudget.isCurrentMonth && (
          <button
            onClick={() => setShowAdjustment(!showAdjustment)}
            className="btn-secondary text-sm"
          >
            {showAdjustment ? 'Скрыть' : 'Настроить'}
          </button>
        )}
      </div>

      {/* Current Daily Limit */}
      <div className="card p-6 bg-gray-50 dark:bg-gray-800/50 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Текущий дневной лимит</span>
          <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
            {dailyBudget.daysLeftInMonth} {
              dailyBudget.daysLeftInMonth === 1 ? 'день' : 
              dailyBudget.daysLeftInMonth < 5 ? 'дня' : 'дней'
            } осталось
          </span>
        </div>
        
        <div className={`text-3xl font-bold currency ${
          isOverBudget ? 'status-negative' : 'status-positive'
        }`}>
          {formatCurrency(dailyBudget.finalDailyLimit)}
        </div>
        
        {dailyBudget.basicDailyLimit !== dailyBudget.finalDailyLimit && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Базовый лимит: <span className="font-medium">{formatCurrency(dailyBudget.basicDailyLimit)}</span>
          </div>
        )}
      </div>

      {/* Adjustment Information */}
      {hasAdjustment && (
        <div className={`p-4 rounded-xl mb-6 ${
          dailyBudget.automaticAdjustment > 0 
            ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800' 
            : 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              dailyBudget.automaticAdjustment > 0 
                ? 'bg-success-100 dark:bg-success-900/40' 
                : 'bg-warning-100 dark:bg-warning-900/40'
            }`}>
              <svg 
                className={`w-5 h-5 ${
                  dailyBudget.automaticAdjustment > 0 
                    ? 'text-success-600 dark:text-success-400' 
                    : 'text-warning-600 dark:text-warning-400'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={dailyBudget.automaticAdjustment > 0 
                    ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                    : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  } 
                />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${
                dailyBudget.automaticAdjustment > 0 
                  ? 'text-success-800 dark:text-success-200' 
                  : 'text-warning-800 dark:text-warning-200'
              }`}>
                {dailyBudget.automaticAdjustment > 0 ? 'Экономия' : 'Корректировка'}
              </p>
              <p className={`text-sm mt-1 ${
                dailyBudget.automaticAdjustment > 0 
                  ? 'text-success-600 dark:text-success-300' 
                  : 'text-warning-600 dark:text-warning-300'
              }`}>
                {dailyBudget.automaticAdjustment > 0 ? '+' : ''}
                {formatCurrency(dailyBudget.automaticAdjustment)} к дневному лимиту
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Status */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Остаток месячного бюджета</span>
          <span className={`font-medium currency ${
            dailyBudget.remainingBudget >= 0 ? 'status-positive' : 'status-negative'
          }`}>
            {formatCurrency(dailyBudget.remainingBudget)}
          </span>
        </div>
        
        {dailyBudget.overspendAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Перерасход</span>
            <span className="font-medium status-negative currency">
              {formatCurrency(dailyBudget.overspendAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Manual Adjustment Form */}
      {showAdjustment && dailyBudget.isCurrentMonth && (
        <div className="card p-5 bg-gray-50 dark:bg-gray-800/50 mb-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Ручная корректировка</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="Сумма корректировки"
              className="input w-full sm:w-auto"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleAdjustment}
                disabled={adjusting || !adjustmentValue}
                className="btn-primary flex-1 sm:flex-none"
              >
                {adjusting ? 'Сохранение...' : 'Применить'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustment(false);
                  setAdjustmentValue('');
                }}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Отмена
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Положительное значение увеличит дневной лимит, отрицательное — уменьшит
          </p>
        </div>
      )}

      {/* Progress Indicator */}
      {dailyBudget.isCurrentMonth && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Прогресс месяца</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {Math.round(((new Date().getDate() - 1) / new Date(dailyBudget.year, dailyBudget.month, 0).getDate()) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.round(((new Date().getDate() - 1) / new Date(dailyBudget.year, dailyBudget.month, 0).getDate()) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySpendingCard;