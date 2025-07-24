import React, { useState, useEffect } from 'react';
import { useDailyBudget, useAdjustDailyBudget } from '../hooks/useBudget';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface SpendingAdjustmentProps {
  month?: number;
  year?: number;
  onAdjustmentChange?: (adjustment: number) => void;
}

const SpendingAdjustment: React.FC<SpendingAdjustmentProps> = ({ 
  month, 
  year, 
  onAdjustmentChange 
}) => {
  const { data: dailyBudget, loading, error, refetch } = useDailyBudget(month, year);
  const { mutate: adjustBudget, loading: adjusting } = useAdjustDailyBudget();
  
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [previewAdjustment, setPreviewAdjustment] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Обновляем предварительный просмотр при изменении значения корректировки
  useEffect(() => {
    const adjustment = parseFloat(adjustmentValue);
    if (!isNaN(adjustment) && adjustment !== 0) {
      setPreviewAdjustment(adjustment);
    } else {
      setPreviewAdjustment(null);
    }
  }, [adjustmentValue]);

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
      
      setAdjustmentValue('');
      setPreviewAdjustment(null);
      onAdjustmentChange?.(adjustment);
      refetch();
    } catch (error) {
      console.error('Error adjusting budget:', error);
    }
  };

  const handleQuickAdjustment = async (amount: number) => {
    if (!dailyBudget) return;

    try {
      await adjustBudget({
        month: dailyBudget.month,
        year: dailyBudget.year,
        adjustment: amount
      });
      
      onAdjustmentChange?.(amount);
      refetch();
    } catch (error) {
      console.error('Error adjusting budget:', error);
    }
  };

  const resetAdjustment = async () => {
    if (!dailyBudget) return;

    try {
      await adjustBudget({
        month: dailyBudget.month,
        year: dailyBudget.year,
        adjustment: 0
      });
      
      onAdjustmentChange?.(0);
      refetch();
    } catch (error) {
      console.error('Error resetting adjustment:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner size="md" message="Загрузка данных корректировки..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!dailyBudget) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-center">Нет данных для корректировки</p>
      </div>
    );
  }

  const isOverBudget = dailyBudget.remainingBudget < 0;
  const isUnderspent = dailyBudget.automaticAdjustment > 0;
  const hasManualAdjustment = dailyBudget.adjustedDailyLimit !== dailyBudget.basicDailyLimit;
  const previewLimit = previewAdjustment ? dailyBudget.finalDailyLimit + previewAdjustment : null;

  // считаем уровень перерасхода
  const getOverspendSeverity = () => {
    if (!isOverBudget) return 'none';
    const overspendRatio = dailyBudget.overspendAmount / Math.abs(dailyBudget.remainingBudget);
    if (overspendRatio > 0.5) return 'critical';
    if (overspendRatio > 0.25) return 'high';
    return 'moderate';
  };

  const severity = getOverspendSeverity();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Корректировка расходов</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          {showAdvanced ? 'Простой режим' : 'Расширенный режим'}
        </button>
      </div>

      {/* Статус бюджета (визуальный индикатор) */}
      <div className="mb-6">
        {isOverBudget && (
          <div className={`p-4 rounded-lg border-l-4 ${
            severity === 'critical' 
              ? 'bg-red-50 border-red-500' 
              : severity === 'high'
              ? 'bg-orange-50 border-orange-500'
              : 'bg-yellow-50 border-yellow-500'
          }`}>
            <div className="flex items-center">
              <svg 
                className={`w-5 h-5 mr-3 ${
                  severity === 'critical' 
                    ? 'text-red-500' 
                    : severity === 'high'
                    ? 'text-orange-500'
                    : 'text-yellow-500'
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
              <div>
                <h3 className={`font-medium ${
                  severity === 'critical' 
                    ? 'text-red-800' 
                    : severity === 'high'
                    ? 'text-orange-800'
                    : 'text-yellow-800'
                }`}>
                  {severity === 'critical' && 'Критический перерасход'}
                  {severity === 'high' && 'Значительный перерасход'}
                  {severity === 'moderate' && 'Умеренный перерасход'}
                </h3>
                <p className={`text-sm ${
                  severity === 'critical' 
                    ? 'text-red-600' 
                    : severity === 'high'
                    ? 'text-orange-600'
                    : 'text-yellow-600'
                }`}>
                  Перерасход составляет {formatCurrency(dailyBudget.overspendAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isUnderspent && !isOverBudget && (
          <div className="p-4 rounded-lg border-l-4 bg-green-50 border-green-500">
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 mr-3 text-green-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <h3 className="font-medium text-green-800">Экономия бюджета</h3>
                <p className="text-sm text-green-600">
                  Вы экономите {formatCurrency(dailyBudget.automaticAdjustment)} в день
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Текущий статус */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Текущий дневной лимит</div>
          <div className={`text-xl font-bold ${
            isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}>
            {formatCurrency(dailyBudget.finalDailyLimit)}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Остаток бюджета</div>
          <div className={`text-xl font-bold ${
            dailyBudget.remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(dailyBudget.remainingBudget)}
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewLimit && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Предварительный просмотр</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 dark:text-blue-400">Новый дневной лимит:</span>
            <span className="font-bold text-blue-800 dark:text-blue-300">
              {formatCurrency(previewLimit)}
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Изменение: {previewAdjustment && previewAdjustment > 0 ? '+' : ''}{formatCurrency(previewAdjustment || 0)}
          </div>
        </div>
      )}

      {/* Быстрая корректировка */}
      {!showAdvanced && dailyBudget.isCurrentMonth && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Быстрая корректировка</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAdjustment(-500)}
              disabled={adjusting}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              -500 ₽
            </button>
            <button
              onClick={() => handleQuickAdjustment(-200)}
              disabled={adjusting}
              className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              -200 ₽
            </button>
            <button
              onClick={() => handleQuickAdjustment(200)}
              disabled={adjusting}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              +200 ₽
            </button>
            <button
              onClick={() => handleQuickAdjustment(500)}
              disabled={adjusting}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              +500 ₽
            </button>
          </div>
        </div>
      )}

      {/* Расширенная корректировка */}
      {(showAdvanced || !dailyBudget.isCurrentMonth) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Точная корректировка</h4>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={adjustmentValue}
              onChange={(e) => setAdjustmentValue(e.target.value)}
              placeholder="Сумма корректировки"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAdjustment}
              disabled={adjusting || !adjustmentValue}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adjusting ? 'Применение...' : 'Применить'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Положительное значение увеличит дневной лимит, отрицательное — уменьшит
          </p>
        </div>
      )}

      {/* Reset Button */}
      {hasManualAdjustment && (
        <div className="flex justify-center">
          <button
            onClick={resetAdjustment}
            disabled={adjusting}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {adjusting ? 'Сброс...' : 'Сбросить корректировки'}
          </button>
        </div>
      )}

      {/* Доп инфа */}
      {showAdvanced && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Дополнительная информация</h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Базовый дневной лимит:</span>
              <span>{formatCurrency(dailyBudget.basicDailyLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Автоматическая корректировка:</span>
              <span className={dailyBudget.automaticAdjustment >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {dailyBudget.automaticAdjustment >= 0 ? '+' : ''}{formatCurrency(dailyBudget.automaticAdjustment)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Дней осталось в месяце:</span>
              <span>{dailyBudget.daysLeftInMonth}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingAdjustment;
