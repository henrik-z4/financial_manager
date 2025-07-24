import { useApi, useMutation } from './useApi';
import { reserveService } from '../services/reserveService';
import type { Reserve, CreateReserveRequest, UpdateReserveRequest } from '../types/api';

// хук для получения всех резервов
export function useReserves() {
  return useApi(() => reserveService.getAll());
}

// хук для получения резерва по id
export function useReserve(id: number) {
  return useApi(() => reserveService.getById(id), [id]);
}

// хук для создания резерва
export function useCreateReserve() {
  return useMutation<Reserve, CreateReserveRequest>(
    (reserve) => reserveService.create(reserve)
  );
}

// хук для обновления резерва
export function useUpdateReserve() {
  return useMutation<Reserve, { id: number; reserve: UpdateReserveRequest }>(
    ({ id, reserve }) => reserveService.update(id, reserve)
  );
}

// хук для удаления резерва
export function useDeleteReserve() {
  return useMutation<void, number>(
    (id) => reserveService.delete(id)
  );
}

// хук для пополнения резерва
export function useAddMoneyToReserve() {
  return useMutation<Reserve, { id: number; amount: number }>(
    ({ id, amount }) => reserveService.addMoney(id, amount)
  );
}

// хук для снятия средств с резерва
export function useWithdrawMoneyFromReserve() {
  return useMutation<Reserve, { id: number; amount: number }>(
    ({ id, amount }) => reserveService.withdrawMoney(id, amount)
  );
}