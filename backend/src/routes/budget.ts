import { Router, Request, Response } from 'express';
import { BudgetService } from '../services/BudgetService';
import { ApiResponse } from '../types';
import db from '../utils/database';
import { body, query, validationResult } from 'express-validator';

const router = Router();
const budgetService = new BudgetService(db);

// GET /api/budget/monthly - рассчеты ежемесячного бюджета
router.get('/monthly', [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12'),
  query('year').optional().isInt({ min: 2000, max: 3000 }).withMessage('Год должен быть корректным')
], async (req: Request, res: Response) => {
  try {
    // проверяем наличие ошибок валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации параметров',
          details: errors.array()
        }
      };
      return res.status(400).json(response);
    }

    // парсим параметры месяца и года или используем текущие
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    let budgetCalculation;
    
    if (month && year) {
      // получаем бюджет за указанный месяц и год
      budgetCalculation = await budgetService.calculateMonthlyBudget(month, year);
    } else {
      // получаем бюджет за текущий месяц
      budgetCalculation = await budgetService.calculateCurrentMonthBudget();
    }

    const response: ApiResponse<typeof budgetCalculation> = {
      success: true,
      data: budgetCalculation
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при расчете месячного бюджета'
      }
    };
    res.status(500).json(response);
  }
});

// GET /api/budget/daily - рассчеты дневного бюджета
router.get('/daily', [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12'),
  query('year').optional().isInt({ min: 2000, max: 3000 }).withMessage('Год должен быть корректным')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации параметров',
          details: errors.array()
        }
      };
      return res.status(400).json(response);
    }

    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();

    const budgetCalculation = await budgetService.calculateMonthlyBudget(month, year);
    
    const automaticAdjustment = await budgetService.calculateDailySpendingAdjustment(month, year);
    
    const finalDailyLimit = Math.max(0, budgetCalculation.adjustedDailyLimit + automaticAdjustment);

    const dailyBudgetData = {
      month,
      year,
      basicDailyLimit: budgetCalculation.dailySpendingLimit,
      adjustedDailyLimit: budgetCalculation.adjustedDailyLimit,
      automaticAdjustment,
      finalDailyLimit,
      daysLeftInMonth: budgetCalculation.daysLeftInMonth,
      remainingBudget: budgetCalculation.remainingBudget,
      overspendAmount: budgetCalculation.overspendAmount,
      isCurrentMonth: month === now.getMonth() + 1 && year === now.getFullYear()
    };

    const response: ApiResponse<typeof dailyBudgetData> = {
      success: true,
      data: dailyBudgetData
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting daily budget:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при расчете дневного бюджета'
      }
    };
    res.status(500).json(response);
  }
});

// POST /api/budget/adjust - ставим ручную корректировку дневного бюджета
router.post('/adjust', [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Месяц должен быть от 1 до 12'),
  body('year').isInt({ min: 2000, max: 3000 }).withMessage('Год должен быть корректным'),
  body('adjustment').isNumeric().withMessage('Корректировка должна быть числом')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ошибка валидации данных',
          details: errors.array()
        }
      };
      return res.status(400).json(response);
    }

    const { month, year, adjustment } = req.body;

    await budgetService.setManualDailyAdjustment(month, year, parseFloat(adjustment));

    const updatedBudget = await budgetService.calculateMonthlyBudget(month, year);

    const response: ApiResponse<typeof updatedBudget> = {
      success: true,
      data: updatedBudget
    };

    res.json(response);
  } catch (error) {
    console.error('Error adjusting budget:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ошибка при корректировке бюджета'
      }
    };
    res.status(500).json(response);
  }
});

export default router;