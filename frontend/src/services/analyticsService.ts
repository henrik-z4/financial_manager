import api from './api';
import type { AnalyticsResponse, ApiResponse } from '../types/api';

export const analyticsService = {
  // получить аналитику за период
  getAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get<ApiResponse<AnalyticsResponse>>('/analytics', { params });
    return response.data.data;
  },

  // получить помесячную аналитику
  getMonthlyAnalytics: async (year?: number): Promise<AnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (year) params.year = year.toString();

    const response = await api.get<ApiResponse<AnalyticsResponse>>('/analytics/monthly', { params });
    return response.data.data;
  },

  // получить аналитику по категориям
  getCategoryAnalytics: async (startDate?: string, endDate?: string): Promise<AnalyticsResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get<ApiResponse<AnalyticsResponse>>('/analytics/categories', { params });
    return response.data.data;
  }
};