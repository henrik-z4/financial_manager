import { useApi, useMutation } from './useApi';
import { budgetService, type BudgetCalculation } from '../services/budgetService';

// хук для получения расчёта месячного бюджета
export function useMonthlyBudget(month?: number, year?: number) {
  return useApi(() => budgetService.getMonthly(month, year));
}

// хук для получения данных по ежедневному бюджету
export function useDailyBudget(month?: number, year?: number) {
  return useApi(() => budgetService.getDaily(month, year));
}

// хук для корректировки ежедневного бюджета
export function useAdjustDailyBudget() {
  return useMutation<BudgetCalculation, { month: number; year: number; adjustment: number }>(
    ({ month, year, adjustment }) => budgetService.adjustDaily(month, year, adjustment)
  );
}