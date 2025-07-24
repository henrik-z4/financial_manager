import axios, { type AxiosInstance, AxiosError } from 'axios';

// конфигурация API
const API_BASE_URL = 'http://localhost:3001/api';

// создаём экземпляр axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// перехватчик запросов
api.interceptors.request.use(
  (config) => {
    // добавить токены авторизации здесь в будущем
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// перехватчик ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // обработка распространённых ошибок
    if (error.response) {
      // сервер вернул ошибку
      const status = error.response.status;
      const message = (error.response.data as any)?.message || 'Произошла ошибка сервера';
      
      switch (status) {
        case 400:
          throw new Error(`Неверный запрос: ${message}`);
        case 401:
          throw new Error('Необходима авторизация');
        case 403:
          throw new Error('Доступ запрещен');
        case 404:
          throw new Error('Ресурс не найден');
        case 500:
          throw new Error('Внутренняя ошибка сервера');
        default:
          throw new Error(`Ошибка ${status}: ${message}`);
      }
    } else if (error.request) {
      // ошибка сети
      throw new Error('Ошибка сети. Проверьте подключение к интернету');
    } else {
      // другая ошибка
      throw new Error('Произошла неожиданная ошибка');
    }
  }
);

export default api;