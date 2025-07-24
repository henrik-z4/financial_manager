// основные интерфейсы данных приложения

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  priority: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  priority: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  type?: 'income' | 'expense';
  category?: string;
  amount?: number;
  description?: string;
  priority?: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date?: string;
  notes?: string;
}

export interface Reserve {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  purpose?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReserveInput {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  purpose?: string;
}

export interface UpdateReserveInput {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  purpose?: string;
}

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

export interface BudgetSettings {
  id: number;
  month: number;
  year: number;
  manualDailyAdjustment: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetSettingsInput {
  month: number;
  year: number;
  manualDailyAdjustment?: number;
}

export interface UpdateBudgetSettingsInput {
  manualDailyAdjustment?: number;
}

// интерфейсы строк базы данных (snake_case из sqlite)
export interface TransactionRow {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  priority: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReserveRow {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  purpose?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetSettingsRow {
  id: number;
  month: number;
  year: number;
  manual_daily_adjustment: number;
  created_at: string;
  updated_at: string;
}

// интерфейсы фильтров для запросов
export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  priority?: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// интерфейсы для аналитики
export interface ExpenseCategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingTrendData {
  period: string; // yyyy-mm для месячных трендов
  income: number;
  expenses: number;
  net: number;
}

export interface IncomeVsExpenseData {
  period: string;
  income: number;
  expenses: number;
  difference: number;
  percentageChange?: number;
}

export interface PriorityBreakdownData {
  priority: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlySummaryData {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  topExpenseCategory: string | null;
}

// интерфейсы для ответов API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}