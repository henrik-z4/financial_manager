import React, { useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useAnalytics } from "../hooks/useAnalytics";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";

// chart.js компоненты
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IncomeVsExpenseChartProps {
  months?: number;
  height?: number;
  className?: string;
}

const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
  months = 6,
  height = 400,
  className = "",
}) => {
  const { spendingTrends, loading, error, fetchSpendingTrends } =
    useAnalytics();

  useEffect(() => {
    fetchSpendingTrends(months);
  }, [months]);

  // Форматируем валюту (на православный рубль)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Форматируем период для отображения (YYYY-MM в читаемый формат)
  const formatPeriod = (period: string): string => {
    const parts = period.split("-");
    if (parts.length !== 2) return period;

    const year = parts[0];
    const month = parts[1];

    if (!year || !month) return period;

    try {
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
      });
    } catch (e) {
      return period;
    }
  };

  // Подготовка данных для графика
  const chartData = useMemo(() => {
    if (!spendingTrends.length) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = spendingTrends.map((item) => formatPeriod(item.period));

    return {
      labels,
      datasets: [
        {
          label: "Доходы",
          data: spendingTrends.map((item) => item.income),
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#10B981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Расходы",
          data: spendingTrends.map((item) => item.expenses),
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#EF4444",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: false,
          tension: 0.4,
        },
        {
          label: "Чистый доход",
          data: spendingTrends.map((item) => item.net),
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#3B82F6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
        },
      ],
    };
  }, [spendingTrends]);

  // Опции диаграммы
  const chartOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context) => {
              if (context.length === 0 || !context[0]) return "Период: -";
              return `Период: ${context[0].label || ""}`;
            },
            label: (context) => {
              const value = formatCurrency(context.parsed.y);
              return `${context.dataset.label}: ${value}`;
            },
            afterBody: (context) => {
              if (context.length > 0 && context[0]) {
                const dataIndex = context[0].dataIndex;
                if (dataIndex !== undefined && spendingTrends[dataIndex]) {
                  const trend = spendingTrends[dataIndex];
                  const savings = trend.net;
                  const savingsRate =
                    trend.income > 0
                      ? ((savings / trend.income) * 100).toFixed(1)
                      : "0";
                  return ["", `Норма сбережений: ${savingsRate}%`];
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
            display: true,
            color: "rgba(0, 0, 0, 0.1)",
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
            color: "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            font: {
              size: 11,
            },
            callback: function (value) {
              return formatCurrency(value as number);
            },
          },
        },
      },
      animation: {
        duration: 1000,
        easing: "easeInOutQuart",
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    }),
    [spendingTrends, formatCurrency]
  );

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorMessage
          message="Ошибка при загрузке данных о доходах и расходах"
          onRetry={() => fetchSpendingTrends(months)}
        />
      </div>
    );
  }

  if (!spendingTrends.length) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-lg font-medium">Нет данных для анализа</p>
          <p className="text-sm">Добавьте транзакции для просмотра трендов</p>
        </div>
      </div>
    );
  }

  // Итоговые значения считаем туда-сюда
  const totalIncome = spendingTrends.reduce(
    (sum, item) => sum + item.income,
    0
  );
  const totalExpenses = spendingTrends.reduce(
    (sum, item) => sum + item.expenses,
    0
  );
  const totalNet = totalIncome - totalExpenses;
  const avgSavingsRate = totalIncome > 0 ? (totalNet / totalIncome) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Доходы vs Расходы
        </h3>
        <p className="text-sm text-gray-600">
          Сравнение доходов и расходов за {months}{" "}
          {months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}
        </p>
      </div>

      <div style={{ height }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Сумма статистики */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <div className="text-gray-600">Общий доход</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-gray-600">Общие расходы</div>
          </div>
          <div className="text-center">
            <div
              className={`font-medium ${
                totalNet >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {formatCurrency(totalNet)}
            </div>
            <div className="text-gray-600">Чистый доход</div>
          </div>
          <div className="text-center">
            <div
              className={`font-medium ${
                avgSavingsRate >= 0 ? "text-blue-600" : "text-red-600"
              }`}
            >
              {avgSavingsRate.toFixed(1)}%
            </div>
            <div className="text-gray-600">Норма сбережений</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeVsExpenseChart;
