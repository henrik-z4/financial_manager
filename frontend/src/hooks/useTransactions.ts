import { useApi, useMutation } from './useApi';
import { transactionService } from '../services/transactionService';
import type { Transaction, CreateTransactionRequest, TransactionFilters, PaginatedResponse } from '../types/api';

// хук для получения всех транзакций с фильтрацией и пагинацией
export function useTransactions(filters?: TransactionFilters) {
  return useApi<PaginatedResponse<Transaction>>(
    () => transactionService.getAll(filters),
    [filters]
  );
}

// хук для получения транзакции по id
export function useTransaction(id: number) {
  return useApi(() => transactionService.getById(id), [id]);
}

// хук для получения транзакций по диапазону дат
export function useTransactionsByDateRange(startDate: string, endDate: string) {
  return useApi(
    () => transactionService.getByDateRange(startDate, endDate),
    [startDate, endDate]
  );
}

// хук для получения транзакций по категории
export function useTransactionsByCategory(category: string) {
  return useApi(
    () => transactionService.getByCategory(category),
    [category]
  );
}

// хук для создания транзакции
export function useCreateTransaction() {
  return useMutation<Transaction, CreateTransactionRequest>(
    (transaction) => transactionService.create(transaction)
  );
}

// хук для обновления транзакции
export function useUpdateTransaction() {
  return useMutation<Transaction, { id: number; transaction: Partial<CreateTransactionRequest> }>(
    ({ id, transaction }) => transactionService.update(id, transaction)
  );
}

// хук для удаления транзакции
export function useDeleteTransaction() {
  return useMutation<void, number>(
    (id) => transactionService.delete(id)
  );
}