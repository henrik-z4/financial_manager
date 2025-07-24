import React, { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAnalytics } from '../hooks/useAnalytics';
import { useMonthlyBudget } from '../hooks/useBudget';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetProgressChartProps {
  months?: number;
  height?: number;
  className?: string;
}

const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({
  months = 6,
  height = 400,
  className = ''
}) => {
  const { incomeVsExpense, loading: analyticsLoading, error: analyticsError, fetchIncomeVsExpense } = useAnalytics();
  const { data: currentBudget, loading: budgetLoading, error: budgetError } = useMonthlyBudget();

  const loading = analyticsLoading || budgetLoading;
  const error = analyticsError || budgetError;

  useEffect(() => {
    fetchIncomeVsExpense(months);
  }, [months]);

  // форматирование валюты для русского языка
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // форматирование периода для отображения (YYYY-MM в читаемый вид)
  const formatPeriod = (period: string): string => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year || '0'), parseInt(month || '0') - 1);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // вычисление процентов использования бюджета
  const budgetData = useMemo(() => {
    if (!incomeVsExpense.length) return [];
    
    return incomeVsExpense.map(item => {
      const budgetUtilization = item.income > 0 ? (item.expenses / item.income) * 100 : 0;
      const savingsRate = item.income > 0 ? (item.difference / item.income) * 100 : 0;
      
      return {
        ...item,
        budgetUtilization: Math.min(budgetUtilization, 100), // максимум 100%
        savingsRate,
        isOverBudget: budgetUtilization > 100
      };
    });
  }, [incomeVsExpense]);

  // подготовка данных для диаграммы
  const chartData = useMemo(() => {
    if (!budgetData.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = budgetData.map(item => formatPeriod(item.period));
    
    return {
      labels,
      datasets: [
        {
          label: 'Использование бюджета (%)',
          data: budgetData.map(item => item.budgetUtilization),
          backgroundColor: budgetData.map(item => 
            item.isOverBudget 
              ? 'rgba(239, 68, 68, 0.8)' 
              : item.budgetUtilization > 80 
                ? 'rgba(245, 158, 11, 0.8)' 
                : 'rgba(16, 185, 129, 0.8)'
          ),
          borderColor: budgetData.map(item => 
            item.isOverBudget 
              ? '#EF4444' 
              : item.budgetUtilization > 80 
                ? '#F59E0B' 
                : '#10B981'
          ),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [budgetData]);

  // опции диаграммы с русской локализацией
  const chartOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context) => {
            return `Период: ${context[0]?.label || ''}`;
          },
          label: (context) => {
            const dataIndex = context.dataIndex;
            const item = budgetData[dataIndex];
            const utilization = context.parsed.y.toFixed(1);
            
            if (!item) return [];
            
            return [
              `Использование бюджета: ${utilization}%`,
              `Доходы: ${formatCurrency(item.income)}`,
              `Расходы: ${formatCurrency(item.expenses)}`,
              `Остаток: ${formatCurrency(item.difference)}`,
              `Норма сбережений: ${item.savingsRate.toFixed(1)}%`
            ];
          },
          afterBody: (context) => {
            if (context.length > 0) {
              const dataIndex = context[0]?.dataIndex;
              const item = dataIndex !== undefined ? budgetData[dataIndex] : undefined;
              
              if (item?.isOverBudget) {
                return ['', '⚠️ Превышение бюджета!'];
              } else if (item && item.budgetUtilization > 80) {
                return ['', '⚡ Близко к лимиту бюджета'];
              } else {
                return ['', '✅ В пределах бюджета'];
              }
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        min: 0,
        max: 120, // позволяет отображать превышение бюджета
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${value}%`;
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }), [budgetData, formatCurrency]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage 
          message="Ошибка при загрузке данных о прогрессе бюджета" 
          onRetry={() => fetchIncomeVsExpense(months)}
        />
      </div>
    );
  }

  if (!budgetData.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium">Нет данных о бюджете</p>
          <p className="text-sm">Добавьте транзакции для отслеживания прогресса</p>
        </div>
      </div>
    );
  }

  // вычисление сводной статистики
  const avgUtilization = budgetData.reduce((sum, item) => sum + item.budgetUtilization, 0) / budgetData.length;
  const avgSavingsRate = budgetData.reduce((sum, item) => sum + item.savingsRate, 0) / budgetData.length;
  const overBudgetMonths = budgetData.filter(item => item.isOverBudget).length;
  const bestMonth = budgetData.reduce((best, current) => 
    current.savingsRate > best.savingsRate ? current : best
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Прогресс бюджета
        </h3>
        <p className="text-sm text-gray-600">
          Использование бюджета за {months} {months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}
        </p>
      </div>
      
      <div style={{ height }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Current month budget info */}
      {currentBudget && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Текущий месяц</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="font-medium text-blue-900">{formatCurrency(currentBudget.remainingBudget)}</div>
              <div className="text-blue-700">Остаток бюджета</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">{formatCurrency(currentBudget.dailySpendingLimit)}</div>
              <div className="text-blue-700">Дневной лимит</div>
            </div>
            <div>
              <div className="font-medium text-blue-900">{currentBudget.daysLeftInMonth}</div>
              <div className="text-blue-700">Дней осталось</div>
            </div>
            <div>
              <div className={`font-medium ${currentBudget.overspendAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {currentBudget.overspendAmount > 0 
                  ? formatCurrency(currentBudget.overspendAmount) 
                  : 'В норме'
                }
              </div>
              <div className="text-blue-700">Перерасход</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{avgUtilization.toFixed(1)}%</div>
            <div className="text-gray-600">Среднее использование</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${avgSavingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgSavingsRate.toFixed(1)}%
            </div>
            <div className="text-gray-600">Средние сбережения</div>
          </div>
          <div className="text-center">
            <div className={`font-medium ${overBudgetMonths > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {overBudgetMonths}
            </div>
            <div className="text-gray-600">Превышений бюджета</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-600">
              {formatPeriod(bestMonth.period)}
            </div>
            <div className="text-gray-600">
              Лучший месяц
              <div className="text-xs text-gray-500">
                {bestMonth.savingsRate.toFixed(1)}% сбережений
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressChart;