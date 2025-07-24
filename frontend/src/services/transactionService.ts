import api from './api';
import type { Transaction, CreateTransactionRequest, ApiResponse, TransactionFilters, PaginatedResponse } from '../types/api';

export const transactionService = {
  // получить все транзакции с фильтрацией и пагинацией
  getAll: async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/transactions', {
      params: filters
    });
    return response.data.data;
  },

  // получить транзакцию по id
  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data.data;
  },

  // создать новую транзакцию
  create: async (transaction: CreateTransactionRequest): Promise<Transaction> => {
    const response = await api.post<ApiResponse<Transaction>>('/transactions', transaction);
    return response.data.data;
  },

  // обновить транзакцию
  update: async (id: number, transaction: Partial<CreateTransactionRequest>): Promise<Transaction> => {
    const response = await api.put<ApiResponse<Transaction>>(`/transactions/${id}`, transaction);
    return response.data.data;
  },

  // удалить транзакцию
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  // получить транзакции по диапазону дат
  getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const filters: TransactionFilters = {
      dateFrom: startDate,
      dateTo: endDate,
      limit: 1000
    };
    const response = await transactionService.getAll(filters);
    return response.items;
  },

  // получить транзакции по категории
  getByCategory: async (category: string): Promise<Transaction[]> => {
    const filters: TransactionFilters = {
      category,
      limit: 1000
    };
    const response = await transactionService.getAll(filters);
    return response.items;
  }
};