import React from 'react';
import { useMonthlyBudget } from '../hooks/useBudget';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface BudgetOverviewProps {
  month?: number;
  year?: number;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ month, year }) => {
  const { data: budget, loading, error, refetch } = useMonthlyBudget(month, year);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, total: number) => {
    if (total <= 0) return 0;
    return Math.min((spent / total) * 100, 100);
  };

  if (loading) {
    return <LoadingSpinner size="md" message="Загрузка бюджета..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!budget) {
    return (
      <div className="card p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">Нет данных о бюджете</p>
      </div>
    );
  }

  const spentPercentage = getProgressPercentage(budget.totalExpenses, budget.totalIncome);
  const reservePercentage = getProgressPercentage(budget.totalReserves, budget.totalIncome);
  const remainingPercentage = Math.max(0, 100 - spentPercentage - reservePercentage);

  return (
    <div className="card p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Обзор бюджета</h2>
        </div>
        <div className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs sm:text-sm font-medium text-center">
          {budget.daysLeftInMonth > 0 
            ? `Осталось дней: ${budget.daysLeftInMonth}`
            : 'Месяц завершен'
          }
        </div>
      </div>

      {/* карточки с итогами за месяц */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card p-3 sm:p-4 border-l-4 border-l-success-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Доходы</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 currency mt-1 truncate">
                {formatCurrency(budget.totalIncome)}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-4 border-l-4 border-l-error-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Расходы</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 currency mt-1 truncate">
                {formatCurrency(budget.totalExpenses)}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-4 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Резервы</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 currency mt-1 truncate">
                {formatCurrency(budget.totalReserves)}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* прогресс-бар бюджета */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Использование бюджета</h3>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(budget.remainingBudget)} осталось
          </span>
        </div>
        
        <div className="progress-bar">
          <div className="h-full flex">
            {/* расходы */}
            <div 
              className="bg-error-500 dark:bg-error-600 transition-all duration-300"
              style={{ width: `${spentPercentage}%` }}
              title={`Расходы: ${formatCurrency(budget.totalExpenses)}`}
            />
            {/* резервы */}
            <div 
              className="bg-primary-500 dark:bg-primary-600 transition-all duration-300"
              style={{ width: `${reservePercentage}%` }}
              title={`Резервы: ${formatCurrency(budget.totalReserves)}`}
            />
            {/* остаток */}
            <div 
              className="bg-success-500 dark:bg-success-600 transition-all duration-300"
              style={{ width: `${remainingPercentage}%` }}
              title={`Остаток: ${formatCurrency(budget.remainingBudget)}`}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-error-500 dark:bg-error-600 rounded-full mr-2"></div>
            <span>Расходы ({spentPercentage.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-500 dark:bg-primary-600 rounded-full mr-2"></div>
            <span>Резервы ({reservePercentage.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success-500 dark:bg-success-600 rounded-full mr-2"></div>
            <span>Остаток ({remainingPercentage.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* статус бюджета */}
      <div className="card p-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Остаток бюджета</h3>
            <p className={`text-2xl font-bold mt-1 currency ${
              budget.remainingBudget >= 0 ? 'status-positive' : 'status-negative'
            }`}>
              {formatCurrency(budget.remainingBudget)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Дневной лимит</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1 currency">
              {formatCurrency(budget.dailySpendingLimit)}
            </p>
          </div>
        </div>
        
        {budget.overspendAmount > 0 && (
          <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-error-100 dark:bg-error-900/40 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-error-800 dark:text-error-200">Превышение бюджета</p>
                <p className="text-sm text-error-600 dark:text-error-300 mt-1">
                  Перерасход: {formatCurrency(budget.overspendAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;