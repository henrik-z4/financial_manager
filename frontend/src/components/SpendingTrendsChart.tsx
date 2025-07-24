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
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// Chart.JS регистрация компонентов
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SpendingTrendsChartProps {
  months?: number;
  height?: number;
  className?: string;
}

const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  months = 12,
  height = 400,
  className = ''
}) => {
  const { spendingTrends, loading, error, fetchSpendingTrends } = useAnalytics();

  useEffect(() => {
    fetchSpendingTrends(months);
  }, [months]);

  // делаем православный рубль
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // форматируем период для отображения
  const formatPeriod = (period: string): string => {
    const parts = period.split('-');
    if (parts.length !== 2) return period;
    
    const year = parts[0];
    const month = parts[1];
    
    if (!year || !month) return period;
    
    try {
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch (e) {
      return period;
    }
  };

  // вычисляем изменения расходов и доходов
  const calculateChanges = useMemo(() => {
    if (spendingTrends.length < 2) return [];
    
    return spendingTrends.map((current, index) => {
      if (index === 0) return { expenseChange: 0, incomeChange: 0 };
      
      const previousItem = spendingTrends[index - 1];
      if (!previousItem) return { expenseChange: 0, incomeChange: 0 };
      
      const expenseChange = previousItem.expenses > 0 
        ? ((current.expenses - previousItem.expenses) / previousItem.expenses) * 100 
        : 0;
      const incomeChange = previousItem.income > 0 
        ? ((current.income - previousItem.income) / previousItem.income) * 100 
        : 0;
      
      return { expenseChange, incomeChange };
    });
  }, [spendingTrends]);

  // Готовим data для графика
  const chartData = useMemo(() => {
    if (!spendingTrends.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = spendingTrends.map(item => formatPeriod(item.period));
    
    return {
      labels,
      datasets: [
        {
          label: 'Расходы',
          data: spendingTrends.map(item => item.expenses),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: '#EF4444',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Доходы',
          data: spendingTrends.map(item => item.income),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [spendingTrends]);

  // Опции диаграммы с русской локализацией
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
            if (context.length === 0 || !context[0]) return 'Период: -';
            return `Период: ${context[0].label || ''}`;
          },
          label: (context) => {
            const value = formatCurrency(context.parsed.y);
            return `${context.dataset.label}: ${value}`;
          },
          afterBody: (context) => {
            if (context.length > 0 && context[0]) {
              const dataIndex = context[0].dataIndex;
              if (dataIndex !== undefined && dataIndex > 0 && calculateChanges[dataIndex]) {
                const changes = calculateChanges[dataIndex];
                const expenseChangeText = changes.expenseChange >= 0 
                  ? `+${changes.expenseChange.toFixed(1)}%` 
                  : `${changes.expenseChange.toFixed(1)}%`;
                const incomeChangeText = changes.incomeChange >= 0 
                  ? `+${changes.incomeChange.toFixed(1)}%` 
                  : `${changes.incomeChange.toFixed(1)}%`;
                
                return [
                  '',
                  `Изменение расходов: ${expenseChangeText}`,
                  `Изменение доходов: ${incomeChangeText}`
                ];
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
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return formatCurrency(value as number);
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
  }), [spendingTrends, calculateChanges, formatCurrency]);

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
          message="Ошибка при загрузке данных о трендах расходов" 
          onRetry={() => fetchSpendingTrends(months)}
        />
      </div>
    );
  }

  if (!spendingTrends.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium">Нет данных для анализа</p>
          <p className="text-sm">Добавьте транзакции для просмотра трендов</p>
        </div>
      </div>
    );
  }

  // вычисляем средние и максимальные значения
  const avgExpenses = spendingTrends.reduce((sum, item) => sum + item.expenses, 0) / spendingTrends.length;
  const avgIncome = spendingTrends.reduce((sum, item) => sum + item.income, 0) / spendingTrends.length;
  const maxExpenses = Math.max(...spendingTrends.map(item => item.expenses));
  const maxIncome = Math.max(...spendingTrends.map(item => item.income));

  // находим период с максимальными расходами
  const maxExpensePeriod = spendingTrends.find(item => item.expenses === maxExpenses)?.period;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Тренды расходов и доходов
        </h3>
        <p className="text-sm text-gray-600">
          Месячная динамика за {months} {months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}
        </p>
      </div>
      
      <div style={{ height }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Сумма статистики */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{formatCurrency(avgExpenses)}</div>
            <div className="text-gray-600">Средние расходы</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{formatCurrency(avgIncome)}</div>
            <div className="text-gray-600">Средний доход</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">{formatCurrency(maxExpenses)}</div>
            <div className="text-gray-600">
              Макс. расходы
              {maxExpensePeriod && (
                <div className="text-xs text-gray-500">
                  {formatPeriod(maxExpensePeriod)}
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{formatCurrency(maxIncome)}</div>
            <div className="text-gray-600">Макс. доход</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingTrendsChart;