import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { ReserveModel } from '../models/Reserve';
import { handleValidationErrors } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { CreateReserveInput, UpdateReserveInput } from '../types';
import { databaseManager } from '../utils/database';

const router = Router();

// правила валидации для создания резерва
const createReserveValidation = [
  body('name')
    .notEmpty()
    .withMessage('Название резерва обязательно для заполнения')
    .isLength({ min: 1, max: 100 })
    .withMessage('Название должно быть от 1 до 100 символов'),
  body('targetAmount')
    .isNumeric()
    .withMessage('Целевая сумма должна быть числом')
    .isFloat({ min: 0 })
    .withMessage('Целевая сумма должна быть положительным числом'),
  body('currentAmount')
    .optional()
    .isNumeric()
    .withMessage('Текущая сумма должна быть числом')
    .isFloat({ min: 0 })
    .withMessage('Текущая сумма должна быть положительным числом'),
  body('purpose')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание цели не должно превышать 500 символов')
];

// прваила валидации для обновления резерва
const updateReserveValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID резерва должен быть положительным числом'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Название резерва не может быть пустым')
    .isLength({ min: 1, max: 100 })
    .withMessage('Название должно быть от 1 до 100 символов'),
  body('targetAmount')
    .optional()
    .isNumeric()
    .withMessage('Целевая сумма должна быть числом')
    .isFloat({ min: 0 })
    .withMessage('Целевая сумма должна быть положительным числом'),
  body('currentAmount')
    .optional()
    .isNumeric()
    .withMessage('Текущая сумма должна быть числом')
    .isFloat({ min: 0 })
    .withMessage('Текущая сумма должна быть положительным числом'),
  body('purpose')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Описание цели не должно превышать 500 символов')
];

// валидация ID резерва
const reserveIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID резерва должен быть положительным числом')
];

// валидация для выделения средств в резерв
const allocateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID резерва должен быть положительным числом'),
  body('amount')
    .isNumeric()
    .withMessage('Сумма должна быть числом')
    .isFloat({ min: 0.01 })
    .withMessage('Сумма должна быть положительным числом больше 0')
];

// GET /api/reserves - получение всех резервов
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const reserves = await reserveModel.findAll();
    
    // считать прогресс по каждому резерву
    const reservesWithProgress = reserves.map(reserve => ({
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    }));

    res.json({
      success: true,
      data: reservesWithProgress
    });
  } catch (error) {
    next(createError('Ошибка при получении списка резервов', 500, 'DATABASE_ERROR'));
  }
});

// GET /api/reserves/:id - получение резерва по ID
router.get('/:id', reserveIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const id = parseInt(req.params.id);
    const reserve = await reserveModel.findById(id);
    
    if (!reserve) {
      return next(createError('Резерв не найден', 404, 'RESERVE_NOT_FOUND'));
    }

    // добавить вычисляемые поля
    const reserveWithProgress = {
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    };

    res.json({
      success: true,
      data: reserveWithProgress
    });
  } catch (error) {
    next(createError('Ошибка при получении резерва', 500, 'DATABASE_ERROR'));
  }
});

// POST /api/reserves - создание нового резерва
router.post('/', createReserveValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const input: CreateReserveInput = {
      name: req.body.name,
      targetAmount: parseFloat(req.body.targetAmount),
      currentAmount: req.body.currentAmount ? parseFloat(req.body.currentAmount) : 0,
      purpose: req.body.purpose || null
    };

    const reserve = await reserveModel.create(input);
    
    // добавить вычисляемые поля
    const reserveWithProgress = {
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    };

    res.status(201).json({
      success: true,
      data: reserveWithProgress,
      message: 'Резерв успешно создан'
    });
  } catch (error) {
    next(createError('Ошибка при создании резерва', 500, 'DATABASE_ERROR'));
  }
});

// PUT /api/reserves/:id - обновить резерв (существующий)
router.put('/:id', updateReserveValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const id = parseInt(req.params.id);
    
    const input: UpdateReserveInput = {};
    if (req.body.name !== undefined) input.name = req.body.name;
    if (req.body.targetAmount !== undefined) input.targetAmount = parseFloat(req.body.targetAmount);
    if (req.body.currentAmount !== undefined) input.currentAmount = parseFloat(req.body.currentAmount);
    if (req.body.purpose !== undefined) input.purpose = req.body.purpose;

    const reserve = await reserveModel.update(id, input);
    
    if (!reserve) {
      return next(createError('Резерв не найден', 404, 'RESERVE_NOT_FOUND'));
    }

    // добавить вычисляемые поля
    const reserveWithProgress = {
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    };

    res.json({
      success: true,
      data: reserveWithProgress,
      message: 'Резерв успешно обновлен'
    });
  } catch (error) {
    next(createError('Ошибка при обновлении резерва', 500, 'DATABASE_ERROR'));
  }
});

// DELETE /api/reserves/:id - удалить резерв
router.delete('/:id', reserveIdValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const id = parseInt(req.params.id);
    
    // сначала смотрим существует ли резерв
    const existingReserve = await reserveModel.findById(id);
    if (!existingReserve) {
      return next(createError('Резерв не найден', 404, 'RESERVE_NOT_FOUND'));
    }

    const deleted = await reserveModel.delete(id);
    
    if (!deleted) {
      return next(createError('Не удалось удалить резерв', 500, 'DELETE_FAILED'));
    }

    res.json({
      success: true,
      message: 'Резерв успешно удален'
    });
  } catch (error) {
    next(createError('Ошибка при удалении резерва', 500, 'DATABASE_ERROR'));
  }
});

// POST /api/reserves/:id/allocate - распределить средства в резерв
router.post('/:id/allocate', allocateValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const id = parseInt(req.params.id);
    const amount = parseFloat(req.body.amount);
    
    // проверяем существует ли резерв
    const existingReserve = await reserveModel.findById(id);
    if (!existingReserve) {
      return next(createError('Резерв не найден', 404, 'RESERVE_NOT_FOUND'));
    }

    const reserve = await reserveModel.addAmount(id, amount);
    
    if (!reserve) {
      return next(createError('Не удалось выделить средства в резерв', 500, 'ALLOCATION_FAILED'));
    }

    // добавить вычисляемые поля
    const reserveWithProgress = {
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    };

    res.json({
      success: true,
      data: reserveWithProgress,
      message: `Успешно выделено ${amount} руб. в резерв "${reserve.name}"`
    });
  } catch (error) {
    next(createError('Ошибка при выделении средств в резерв', 500, 'DATABASE_ERROR'));
  }
});

// POST /api/reserves/:id/withdraw - снимаем деньги с резерва
router.post('/:id/withdraw', allocateValidation, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const id = parseInt(req.params.id);
    const amount = parseFloat(req.body.amount);
    
    const existingReserve = await reserveModel.findById(id);
    if (!existingReserve) {
      return next(createError('Резерв не найден', 404, 'RESERVE_NOT_FOUND'));
    }

    // смотрим есть ли достаточно средств для снятия
    if (existingReserve.currentAmount < amount) {
      return next(createError(
        `Недостаточно средств в резерве. Доступно: ${existingReserve.currentAmount} руб., запрошено: ${amount} руб.`,
        400,
        'INSUFFICIENT_FUNDS'
      ));
    }

    const reserve = await reserveModel.subtractAmount(id, amount);
    
    if (!reserve) {
      return next(createError('Не удалось снять средства с резерва', 500, 'WITHDRAWAL_FAILED'));
    }

    const reserveWithProgress = {
      ...reserve,
      completionPercentage: reserve.targetAmount > 0 
        ? Math.min(100, (reserve.currentAmount / reserve.targetAmount) * 100)
        : 0,
      remainingAmount: Math.max(0, reserve.targetAmount - reserve.currentAmount)
    };

    res.json({
      success: true,
      data: reserveWithProgress,
      message: `Успешно снято ${amount} руб. с резерва "${reserve.name}"`
    });
  } catch (error) {
    next(createError('Ошибка при снятии средств с резерва', 500, 'DATABASE_ERROR'));
  }
});

// GET /api/reserves/summary - получить сводку по резервам
router.get('/summary/totals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = databaseManager.getDatabase();
    const reserveModel = new ReserveModel(db);
    const reserves = await reserveModel.findAll();
    const totalCurrent = await reserveModel.getTotalCurrentAmount();
    const totalTarget = await reserveModel.getTotalTargetAmount();
    
    const summary = {
      totalReserves: reserves.length,
      totalCurrentAmount: totalCurrent,
      totalTargetAmount: totalTarget,
      totalRemainingAmount: Math.max(0, totalTarget - totalCurrent),
      overallCompletionPercentage: totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0,
      fullyFundedReserves: reserves.filter(r => r.currentAmount >= r.targetAmount).length,
      partiallyFundedReserves: reserves.filter(r => r.currentAmount > 0 && r.currentAmount < r.targetAmount).length,
      emptyReserves: reserves.filter(r => r.currentAmount === 0).length
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(createError('Ошибка при получении сводки по резервам', 500, 'DATABASE_ERROR'));
  }
});

export default router;
