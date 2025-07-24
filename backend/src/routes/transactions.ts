import { Router, Request, Response, NextFunction } from 'express';
import { TransactionModel } from '../models/Transaction';
import { db } from '../utils/database';
import { handleValidationErrors } from '../middleware/validation';
import { 
  createTransactionValidation, 
  updateTransactionValidation, 
  getTransactionsValidation,
  idParamValidation 
} from '../utils/validation';
import { 
  CreateTransactionInput, 
  UpdateTransactionInput, 
  TransactionFilters,
  ApiResponse,
  PaginatedResponse,
  Transaction 
} from '../types';

const router = Router();
const transactionModel = new TransactionModel(db);

// GET /api/transactions - получение всех транзакций с фильтрацией и пагинацией
router.get(
  '/',
  getTransactionsValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: TransactionFilters = {
        type: req.query.type as 'income' | 'expense' | undefined,
        category: req.query.category as string | undefined,
        priority: req.query.priority as any,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result: PaginatedResponse<Transaction> = await transactionModel.findAll(filters);

      const response: ApiResponse<PaginatedResponse<Transaction>> = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/transactions/:id - получение транзакции по ID
router.get(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await transactionModel.findById(id);

      if (!transaction) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Транзакция не найдена'
          }
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<Transaction> = {
        success: true,
        data: transaction
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/transactions - создать новую транзакцию
router.post(
  '/',
  createTransactionValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: CreateTransactionInput = {
        type: req.body.type,
        category: req.body.category,
        amount: parseFloat(req.body.amount),
        // описание транзакции
        description: req.body.description,
        priority: req.body.priority,
        date: req.body.date,
        notes: req.body.notes
      };

      const transaction = await transactionModel.create(input);

      const response: ApiResponse<Transaction> = {
        success: true,
        data: transaction
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/transactions/:id - обновить существующую транзакцию
router.put(
  '/:id',
  updateTransactionValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      
      const input: UpdateTransactionInput = {};
      
      // только поля, которые переданы в запросе
      if (req.body.type !== undefined) input.type = req.body.type;
      if (req.body.category !== undefined) input.category = req.body.category;
      if (req.body.amount !== undefined) input.amount = parseFloat(req.body.amount);
      // описание транзакции
      if (req.body.description !== undefined) input.description = req.body.description;
      if (req.body.priority !== undefined) input.priority = req.body.priority;
      if (req.body.date !== undefined) input.date = req.body.date;
      if (req.body.notes !== undefined) input.notes = req.body.notes;

      const transaction = await transactionModel.update(id, input);

      if (!transaction) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Транзакция не найдена'
          }
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<Transaction> = {
        success: true,
        data: transaction
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/transactions/:id - удалить транзакцию
router.delete(
  '/:id',
  idParamValidation,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await transactionModel.delete(id);

      if (!deleted) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Транзакция не найдена'
          }
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Транзакция успешно удалена' }
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;