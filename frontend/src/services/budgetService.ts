import api from './api';
import type { ApiResponse } from '../types/api';

export interface BudgetCalculation {
  totalIncome: number;
  totalExpenses: number;
  totalReserves: number;
  remainingBudget: number;
  dailySpendingLimit: number;
  daysLeftInMonth: number;
  overspendAmount: number;
  adjustedDailyLimit: number;
}

export interface DailyBudgetData {
  month: number;
  year: number;
  basicDailyLimit: number;
  adjustedDailyLimit: number;
  automaticAdjustment: number;
  finalDailyLimit: number;
  daysLeftInMonth: number;
  remainingBudget: number;
  overspendAmount: number;
  isCurrentMonth: boolean;
}

export const budgetService = {
  // получить расчет бюджета за месяц
  getMonthly: async (month?: number, year?: number): Promise<BudgetCalculation> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<ApiResponse<BudgetCalculation>>(`/budget/monthly?${params}`);
    return response.data.data;
  },

  // получить данные по дневному бюджету с учетом корректировок
  getDaily: async (month?: number, year?: number): Promise<DailyBudgetData> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await api.get<ApiResponse<DailyBudgetData>>(`/budget/daily?${params}`);
    return response.data.data;
  },

  // установить ручную корректировку дневного лимита
  adjustDaily: async (month: number, year: number, adjustment: number): Promise<BudgetCalculation> => {
    const response = await api.post<ApiResponse<BudgetCalculation>>('/budget/adjust', {
      month,
      year,
      adjustment
    });
    return response.data.data;
  }
};