import { Request, Response, NextFunction } from 'express';


// интерфейс для ошибок API
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  // сопоставление кодов ошибок с русскими сообщениями
  const errorMessages: Record<string, string> = {
    'VALIDATION_ERROR': 'ошибка валидации данных',
    'NOT_FOUND': 'ресурс не найден',
    'UNAUTHORIZED': 'неавторизованный доступ',
    'FORBIDDEN': 'доступ запрещен',
    'INTERNAL_ERROR': 'внутренняя ошибка сервера',
    'DATABASE_ERROR': 'ошибка базы данных',
    'INVALID_INPUT': 'неверные входные данные'
  };

  // если ошибка валидации, используем оригинальное сообщение
  const message = err.code === 'VALIDATION_ERROR' && err.message.startsWith('Ошибки валидации')
    ? err.message
    : err.code && errorMessages[err.code] 
      ? errorMessages[err.code] 
      : err.message || 'произошла неизвестная ошибка';

  console.error(`ошибка ${statusCode}: ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      message: message,
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    }
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Запрашиваемый ресурс не найден'
    }
  });
};

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};