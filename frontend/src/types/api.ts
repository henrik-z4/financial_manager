// Типы транзакций
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

export interface CreateTransactionRequest {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  priority: 'низкий' | 'средний' | 'максимальный' | 'высокий' | 'целевой';
  date: string;
  notes?: string;
}

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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Типы бюджета
export interface BudgetSettings {
  id: number;
  monthly_limit: number;
  daily_limit: number;
  categories: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface UpdateBudgetRequest {
  monthly_limit?: number;
  daily_limit?: number;
  categories?: Record<string, number>;
}

// Типы резервов
export interface Reserve {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  purpose?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReserveRequest {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  purpose?: string;
}

export interface UpdateReserveRequest {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  purpose?: string;
}

// Типы аналитики
export interface CategoryAnalytics {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface MonthlyAnalytics {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface AnalyticsResponse {
  total_income: number;
  total_expenses: number;
  net_income: number;
  categories: CategoryAnalytics[];
  monthly_data: MonthlyAnalytics[];
}

// Wrapper для ответа API
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Типы ошибок API
export interface ApiError {
  message: string;
  code?: string;
}