import React, { useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useAnalytics } from '../hooks/useAnalytics';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// регистрация компонентов Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseChartProps {
  startDate?: string;
  endDate?: string;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

const ExpenseChart: React.FC<ExpenseChartProps> = ({
  startDate,
  endDate,
  height = 400,
  showLegend = true,
  className = ''
}) => {
  const { expensesByCategory, loading, error, fetchExpensesByCategory } = useAnalytics();

  useEffect(() => {
    fetchExpensesByCategory(startDate, endDate);
  }, [startDate, endDate]);

  // генерация цветов для сегментов диаграммы
  const generateColors = (count: number): string[] => {
    const colors = [
      '#3B82F6', // синий
      '#10B981', // зелёный
      '#F59E0B', // оранжевый
      '#EF4444', // красный
      '#8B5CF6', // фиолетовый
      '#06B6D4', // голубой
      '#84CC16', // лайм
      '#F97316', // тёмно-оранжевый
      '#EC4899', // розовый
      '#6366F1', // индиго
      '#14B8A6', // бирюзовый
      '#F59E0B', // янтарный
    ];

    // если нужно больше цветов, чем задано, генерируем дополнительные
    if (count > colors.length) {
      for (let i = colors.length; i < count; i++) {
        const hue = (i * 137.508) % 360; // приближение золотого угла
        colors.push(`hsl(${hue}, 70%, 50%)`);
      }
    }

    return colors.slice(0, count);
  };

  // форматирование валюты для русского языка
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // подготовка данных для диаграммы
  const chartData = useMemo(() => {
    if (!expensesByCategory.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const colors = generateColors(expensesByCategory.length);
    const backgroundColors = colors;
    const borderColors = colors.map(color => color);

    return {
      labels: expensesByCategory.map(item => item.category),
      datasets: [
        {
          data: expensesByCategory.map(item => item.amount),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4,
        },
      ],
    };
  }, [expensesByCategory]);

  // опции диаграммы с русской локализацией
  const chartOptions: ChartOptions<'pie'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                if (!dataset) return { text: '', fillStyle: '', strokeStyle: '', lineWidth: 0, hidden: false, index: i };
                
                const categoryData = expensesByCategory[i];
                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[i] as string 
                  : (dataset.backgroundColor as string || '#000000');
                const borderColor = Array.isArray(dataset.borderColor) 
                  ? dataset.borderColor[i] as string 
                  : (dataset.borderColor as string || '#000000');
                
                return {
                  text: `${label} (${categoryData?.percentage.toFixed(1) || '0.0'}%)`,
                  fillStyle: backgroundColor,
                  strokeStyle: borderColor,
                  lineWidth: (dataset.borderWidth as number) || 1,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
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
            return context.length > 0 ? (context[0]?.label || '') : '';
          },
          label: (context) => {
            const categoryData = expensesByCategory[context.dataIndex];
            const amount = formatCurrency(context.parsed);
            const percentage = categoryData?.percentage.toFixed(1) || '0';
            const count = categoryData?.count || 0;
            
            return [
              `Сумма: ${amount}`,
              `Доля: ${percentage}%`,
              `Транзакций: ${count}`
            ];
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }), [expensesByCategory, showLegend, formatCurrency]);

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
          message="Ошибка при загрузке данных о расходах" 
          onRetry={() => fetchExpensesByCategory(startDate, endDate)}
        />
      </div>
    );
  }

  if (!expensesByCategory.length) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-lg font-medium">Нет данных о расходах</p>
          <p className="text-sm">Добавьте транзакции для просмотра аналитики</p>
        </div>
      </div>
    );
  }

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Расходы по категориям
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Общая сумма расходов: <span className="font-medium">{formatCurrency(totalExpenses)}</span>
        </p>
      </div>
      
      <div style={{ height }}>
        <Pie data={chartData} options={chartOptions} />
      </div>
      
      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900 dark:text-gray-100">{expensesByCategory.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Категорий</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {expensesByCategory.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Транзакций</div>
          </div>
          <div className="text-center sm:col-span-1 col-span-2">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {expensesByCategory.length > 0 
                ? formatCurrency(totalExpenses / expensesByCategory.reduce((sum, item) => sum + item.count, 0))
                : formatCurrency(0)
              }
            </div>
            <div className="text-gray-600 dark:text-gray-400">Средний чек</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;