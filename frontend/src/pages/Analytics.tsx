import React, { useState } from 'react';
import ExpenseChart from '../components/ExpenseChart';
import IncomeVsExpenseChart from '../components/IncomeVsExpenseChart';
import SpendingTrendsChart from '../components/SpendingTrendsChart';
import BudgetProgressChart from '../components/BudgetProgressChart';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Аналитика</h1>
      </div>
      
      {/* фильтр по диапазону дат */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Дата начала
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate || ''}
              onChange={(e) => handleDateRangeChange(e.target.value || undefined, dateRange.endDate)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Дата окончания
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate || ''}
              onChange={(e) => handleDateRangeChange(dateRange.startDate, e.target.value || undefined)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            onClick={() => handleDateRangeChange(undefined, undefined)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* сетка с графиками */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* график распределения расходов */}
        <div className="lg:col-span-2">
          <ExpenseChart 
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            height={400}
            showLegend={true}
          />
        </div>
        
        {/* график доходы против расходов */}
        <div>
          <IncomeVsExpenseChart 
            months={6}
            height={350}
          />
        </div>
        
        {/* график динамики расходов */}
        <div>
          <SpendingTrendsChart 
            months={12}
            height={350}
          />
        </div>
        
        {/* график прогресса бюджета */}
        <div className="lg:col-span-2">
          <BudgetProgressChart 
            months={6}
            height={400}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;