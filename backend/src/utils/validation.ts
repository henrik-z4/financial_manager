import { body, query, param, ValidationChain } from 'express-validator';

// схемы валидации для транзакций
export const createTransactionValidation: ValidationChain[] = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Тип должен быть "income" или "expense"'),
  
  body('category')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Категория должна быть строкой от 1 до 100 символов'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Сумма должна быть положительным числом'),
  
  body('description')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Описание должно быть строкой от 1 до 500 символов'),
  
  body('priority')
    .isIn(['низкий', 'средний', 'максимальный', 'высокий', 'целевой'])
    .withMessage('Приоритет должен быть одним из: низкий, средний, максимальный, высокий, целевой'),
  
  body('date')
    .isISO8601()
    .withMessage('Дата должна быть в формате ISO 8601'),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Заметки должны быть строкой до 1000 символов')
];

export const updateTransactionValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным целым числом'),
  
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Тип должен быть "income" или "expense"'),
  
  body('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Категория должна быть строкой от 1 до 100 символов'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Сумма должна быть положительным числом'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Описание должно быть строкой от 1 до 500 символов'),
  
  body('priority')
    .optional()
    .isIn(['низкий', 'средний', 'максимальный', 'высокий', 'целевой'])
    .withMessage('Приоритет должен быть одним из: низкий, средний, максимальный, высокий, целевой'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Дата должна быть в формате ISO 8601'),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Заметки должны быть строкой до 1000 символов')
];

export const getTransactionsValidation: ValidationChain[] = [
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Тип должен быть "income" или "expense"'),
  
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Категория должна быть строкой от 1 до 100 символов'),
  
  query('priority')
    .optional()
    .isIn(['низкий', 'средний', 'максимальный', 'высокий', 'целевой'])
    .withMessage('Приоритет должен быть одним из: низкий, средний, максимальный, высокий, целевой'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Дата начала должна быть в формате ISO 8601'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Дата окончания должна быть в формате ISO 8601'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Лимит должен быть целым числом от 1 до 1000'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Смещение должно быть неотрицательным целым числом')
];

// схемы валидации для резервов
export const createReserveValidation: ValidationChain[] = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Название должно быть строкой от 1 до 200 символов'),
  
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Целевая сумма должна быть положительным числом'),
  
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Текущая сумма должна быть неотрицательным числом'),
  
  body('purpose')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Цель должна быть строкой до 500 символов')
];

export const updateReserveValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным целым числом'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Название должно быть строкой от 1 до 200 символов'),
  
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Целевая сумма должна быть положительным числом'),
  
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Текущая сумма должна быть неотрицательным числом'),
  
  body('purpose')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Цель должна быть строкой до 500 символов')
];

// схемы валидации для настроек бюджета
export const createBudgetSettingsValidation: ValidationChain[] = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Месяц должен быть целым числом от 1 до 12'),
  
  body('year')
    .isInt({ min: 2000, max: 3000 })
    .withMessage('Год должен быть целым числом от 2000 до 3000'),
  
  body('manualDailyAdjustment')
    .optional()
    .isFloat()
    .withMessage('Ручная корректировка должна быть числом')
];

export const updateBudgetSettingsValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным целым числом'),
  
  body('manualDailyAdjustment')
    .optional()
    .isFloat()
    .withMessage('Ручная корректировка должна быть числом')
];

// общие схемы валидации
export const idParamValidation: ValidationChain[] = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID должен быть положительным целым числом')
];

// валидация диапазона дат
export const dateRangeValidation: ValidationChain[] = [
  query('startDate')
    .isISO8601()
    .withMessage('Дата начала должна быть в формате ISO 8601'),
  
  query('endDate')
    .isISO8601()
    .withMessage('Дата окончания должна быть в формате ISO 8601')
];

// пользовательские функции валидации
export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

export const validateCurrentMonth = (month: number, year: number): boolean => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // разрешить текущий и будущие месяцы
  return year > currentYear || (year === currentYear && month >= currentMonth);
};

// уровни приоритета для валидации
export const PRIORITY_LEVELS = ['низкий', 'средний', 'максимальный', 'высокий', 'целевой'] as const;
export type PriorityLevel = typeof PRIORITY_LEVELS[number];

// типы транзакций для валидации
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

// основные категории (можно расширять)
export const INCOME_CATEGORIES = [
  'Зарплата',
  'Фриланс',
  'Инвестиции',
  'Подарки',
  'Прочие доходы'
] as const;

export const EXPENSE_CATEGORIES = [
  'Продукты',
  'Транспорт',
  'Жилье',
  'Коммунальные услуги',
  'Развлечения',
  'Одежда',
  'Здоровье',
  'Образование',
  'Прочие расходы'
] as const;