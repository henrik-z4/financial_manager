import React, { useEffect } from "react";
import { useAnalytics } from "../hooks";
import { useMonthlyBudget } from "../hooks/useBudget";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import BudgetOverview from "../components/BudgetOverview";
import DailySpendingCard from "../components/DailySpendingCard";

const Dashboard: React.FC = () => {
  const {
    monthlySummary: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    fetchMonthlySummary,
  } = useAnalytics();
  const {
    data: budget,
    loading: budgetLoading,
    error: budgetError,
    refetch: refetchBudget,
  } = useMonthlyBudget();

  useEffect(() => {
    fetchMonthlySummary();
  }, []);

  // форматирует сумму в рубли
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (analyticsLoading || budgetLoading) {
    return <LoadingSpinner size="lg" message="Загрузка данных панели..." />;
  }

  // компонент карточки статистики
  const StatCard = ({
    title,
    value,
    icon,
    color,
    trend,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="card card-hover p-4 sm:p-6 animate-slide-up">
      {/* карточка статистики */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className={`p-2 sm:p-3 rounded-xl ${color} flex-shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 currency mt-1 truncate">
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center mt-1 text-xs ${
                  trend.isPositive
                    ? "text-success-600 dark:text-success-400"
                    : "text-error-600 dark:text-error-400"
                }`}
              >
                <svg
                  className={`w-3 h-3 mr-1 ${
                    trend.isPositive ? "" : "rotate-180"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17l9.2-9.2M17 17V7H7"
                  />
                </svg>
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Главная панель
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Обзор ваших финансов
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {new Date().toLocaleDateString("ru-RU", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {(analyticsError || budgetError) && (
        <ErrorMessage
          message={analyticsError || budgetError || "Ошибка загрузки данных"}
          onRetry={() => {
            fetchMonthlySummary();
            refetchBudget();
          }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Общий доход"
          value={analytics ? formatCurrency(analytics.totalIncome) : "0 ₽"}
          color="bg-success-100 dark:bg-success-900/20"
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-success-600 dark:text-success-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
          }
        />

        <StatCard
          title="Общие расходы"
          value={
            analytics
              ? formatCurrency(Math.abs(analytics.totalExpenses))
              : "0 ₽"
          }
          color="bg-error-100 dark:bg-error-900/20"
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-error-600 dark:text-error-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          }
        />

        <StatCard
          title="Остаток бюджета"
          value={budget ? formatCurrency(budget.remainingBudget) : "0 ₽"}
          color="bg-primary-100 dark:bg-primary-900/20"
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
        />

        <StatCard
          title="Дневной лимит"
          value={budget ? formatCurrency(budget.dailySpendingLimit) : "0 ₽"}
          color="bg-warning-100 dark:bg-warning-900/20"
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600 dark:text-warning-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
      </div>

      {/* секция обзора бюджета */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetOverview />
        <DailySpendingCard />
      </div>

      <div className="card p-4 sm:p-6 lg:p-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Добро пожаловать в ваш финансовый менеджер!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
              Здесь вы можете отслеживать доходы и расходы, управлять бюджетом и
              анализировать свои финансы.
              <span className="hidden sm:inline">
                {" "}
                Используйте навигацию слева для перехода между разделами.
              </span>
            </p>
            {analytics && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
                  Краткая сводка за месяц
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Чистый доход:
                      <span
                        className={`font-semibold ml-2 currency ${
                          analytics.netAmount >= 0
                            ? "status-positive"
                            : "status-negative"
                        }`}
                      >
                        {formatCurrency(analytics.netAmount)}
                      </span>
                    </p>
                  </div>
                  {analytics.topExpenseCategory && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Основная категория расходов:
                        <span className="font-semibold ml-2 text-gray-900 dark:text-gray-100">
                          {analytics.topExpenseCategory}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
