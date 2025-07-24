import api from './api';
import type { Reserve, CreateReserveRequest, UpdateReserveRequest, ApiResponse } from '../types/api';

export const reserveService = {
  // получить все резервы
  getAll: async (): Promise<Reserve[]> => {
    const response = await api.get<ApiResponse<Reserve[]>>('/reserves');
    return response.data.data;
  },

  // получить резерв по id
  getById: async (id: number): Promise<Reserve> => {
    const response = await api.get<ApiResponse<Reserve>>(`/reserves/${id}`);
    return response.data.data;
  },

  // создать новый резерв
  create: async (reserve: CreateReserveRequest): Promise<Reserve> => {
    const response = await api.post<ApiResponse<Reserve>>('/reserves', reserve);
    return response.data.data;
  },

  // обновить резерв
  update: async (id: number, reserve: UpdateReserveRequest): Promise<Reserve> => {
    const response = await api.put<ApiResponse<Reserve>>(`/reserves/${id}`, reserve);
    return response.data.data;
  },

  // удалить резерв
  delete: async (id: number): Promise<void> => {
    await api.delete(`/reserves/${id}`);
  },

  // добавить деньги в резерв
  addMoney: async (id: number, amount: number): Promise<Reserve> => {
    const response = await api.post<ApiResponse<Reserve>>(`/reserves/${id}/allocate`, { amount });
    return response.data.data;
  },

  // снять деньги с резерва
  withdrawMoney: async (id: number, amount: number): Promise<Reserve> => {
    const response = await api.post<ApiResponse<Reserve>>(`/reserves/${id}/withdraw`, { amount });
    return response.data.data;
  }
};