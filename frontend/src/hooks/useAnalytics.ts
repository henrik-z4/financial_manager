import { useState } from 'react';
import api from '../services/api';

export interface ExpenseCategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingTrendData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PriorityBreakdownData {
  priority: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface IncomeVsExpenseData {
  period: string;
  income: number;
  expenses: number;
  difference: number;
  percentageChange?: number;
}

export interface MonthlySummaryData {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  topExpenseCategory: string | null;
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategoryData[]>([]);
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrendData[]>([]);
  const [incomeVsExpense, setIncomeVsExpense] = useState<IncomeVsExpenseData[]>([]);
  const [expensesByPriority, setExpensesByPriority] = useState<PriorityBreakdownData[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(null);

  const fetchExpensesByCategory = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/analytics/expenses', { params });

      if (response.data?.success && response.data?.data) {
        setExpensesByCategory(response.data.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке расходов по категориям:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpendingTrends = async (months: number = 12) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/analytics/trends', { 
        params: { months: months.toString() } 
      });

      if (response.data?.success && response.data?.data) {
        setSpendingTrends(response.data.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке трендов расходов:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesByPriority = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/analytics/priority', { params });

      if (response.data?.success && response.data?.data) {
        setExpensesByPriority(response.data.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке расходов по приоритетам:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeVsExpense = async (months: number = 6) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/analytics/comparison', { 
        params: { months: months.toString() } 
      });

      if (response.data?.success && response.data?.data) {
        setIncomeVsExpense(response.data.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке сравнения доходов и расходов:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/analytics/summary');

      if (response.data?.success && response.data?.data) {
        setMonthlySummary(response.data.data);
      } else {
        setMonthlySummary(null);
      }
    } catch (err) {
      console.error('Ошибка при загрузке месячной сводки:', err);
      setError('Ошибка при загрузке данных');
      setMonthlySummary(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    // данные
    expensesByCategory,
    spendingTrends,
    incomeVsExpense,
    expensesByPriority,
    monthlySummary,
    
    // состояния загрузки и ошибок
    loading,
    error,
    
    // действия
    fetchExpensesByCategory,
    fetchSpendingTrends,
    fetchIncomeVsExpense,
    fetchExpensesByPriority,
    fetchMonthlySummary,
  };
};