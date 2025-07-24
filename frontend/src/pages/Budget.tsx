import React from 'react';
import BudgetOverview from '../components/BudgetOverview';
import DailySpendingCard from '../components/DailySpendingCard';
import SpendingAdjustment from '../components/SpendingAdjustment';

const Budget: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Управление бюджетом</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Контролируйте свои расходы и планируйте бюджет</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Текущий месяц</span>
        </div>
      </div>
      
      {/* Основные компоненты бюджета */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BudgetOverview />
        <DailySpendingCard />
      </div>
      
      {/* Интерфейс корректировки расходов */}
      <div className="grid grid-cols-1 gap-6">
        <SpendingAdjustment />
      </div>
    </div>
  );
};

export default Budget;