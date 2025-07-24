import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { createError } from './errorHandler';


export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // сопоставление типовых ошибок валидации с русскими сообщениями
    const errorMessages = errors.array().map((error: ValidationError) => {
      const russianMessages: Record<string, string> = {
        'Invalid value': 'неверное значение',
        'is required': 'обязательно для заполнения',
        'must be a number': 'должно быть числом',
        'must be a string': 'должно быть строкой',
        'must be a valid date': 'должно быть корректной датой',
        'must be at least': 'должно быть не менее',
        'must be at most': 'должно быть не более',
        'must be one of': 'должно быть одним из'
      };

      let message = error.msg;
      Object.entries(russianMessages).forEach(([english, russian]) => {
        if (message.includes(english)) {
          message = message.replace(english, russian);
        }
      });

      return {
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: message
      };
    });

    const error = createError(
      `Ошибки валидации: ${errorMessages.map(e => `${e.field}: ${e.message}`).join(', ')}`,
      400,
      'VALIDATION_ERROR'
    );
    
    return next(error);
  }
  
  next();
};