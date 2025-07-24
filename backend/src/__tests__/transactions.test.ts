// тесты транзакций
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import transactionsRouter from '../routes/transactions';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { CreateTransactionInput, UpdateTransactionInput } from '../types';

// создаём тестовое приложение
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/transactions', transactionsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Transaction API Endpoints', () => {
  let createdTransactionId: number;

  const validTransactionData: CreateTransactionInput = {
    type: 'expense',
    category: 'Продукты',
    amount: 1500.50,
    description: 'Покупка продуктов в магазине',
    priority: 'средний',
    date: '2024-01-15',
    notes: 'Тестовая заметка'
  };

  const validIncomeData: CreateTransactionInput = {
    type: 'income',
    category: 'Зарплата',
    amount: 50000,
    description: 'Месячная зарплата',
    priority: 'высокий',
    date: '2024-01-01'
  };

  describe('POST /api/transactions', () => {
    it('должен создать новую транзакцию расхода', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: validTransactionData.type,
        category: validTransactionData.category,
        amount: validTransactionData.amount,
        description: validTransactionData.description,
        priority: validTransactionData.priority,
        date: validTransactionData.date,
        notes: validTransactionData.notes
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();

      createdTransactionId = response.body.data.id;
    });

    it('должен создать новую транзакцию дохода без заметок', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send(validIncomeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: validIncomeData.type,
        category: validIncomeData.category,
        amount: validIncomeData.amount,
        description: validIncomeData.description,
        priority: validIncomeData.priority,
        date: validIncomeData.date
      });
      expect(response.body.data.notes).toBeNull();
    });

    it('должен вернуть ошибку валидации при отсутствии обязательных полей', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('Ошибки валидации');
    });

    it('должен вернуть ошибку валидации при неверном типе транзакции', async () => {
      const invalidData = { ...validTransactionData, type: 'invalid' };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('должен вернуть ошибку валидации при неверном приоритете', async () => {
      const invalidData = { ...validTransactionData, priority: 'invalid' };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('должен вернуть ошибку валидации при отрицательной сумме', async () => {
      const invalidData = { ...validTransactionData, amount: -100 };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('должен вернуть ошибку валидации при неверном формате даты', async () => {
      const invalidData = { ...validTransactionData, date: 'invalid-date' };
      
      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/transactions', () => {
    it('должен получить все транзакции с пагинацией', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('offset');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('должен фильтровать транзакции по типу', async () => {
      const response = await request(app)
        .get('/api/transactions?type=expense')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.items.forEach((transaction: any) => {
        expect(transaction.type).toBe('expense');
      });
    });

    it('должен фильтровать транзакции по категории', async () => {
      const response = await request(app)
        .get('/api/transactions?category=Продукты')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.items.forEach((transaction: any) => {
        expect(transaction.category).toBe('Продукты');
      });
    });

    it('должен фильтровать транзакции по приоритету', async () => {
      const response = await request(app)
        .get('/api/transactions?priority=средний')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.items.forEach((transaction: any) => {
        expect(transaction.priority).toBe('средний');
      });
    });

    it('должен фильтровать транзакции по диапазону дат', async () => {
      const response = await request(app)
        .get('/api/transactions?dateFrom=2024-01-01&dateTo=2024-01-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.items.forEach((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        expect(transactionDate).toBeInstanceOf(Date);
        expect(transactionDate.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01').getTime());
        expect(transactionDate.getTime()).toBeLessThanOrEqual(new Date('2024-01-31').getTime());
      });
    });

    it('должен учитывать параметры пагинации', async () => {
      const response = await request(app)
        .get('/api/transactions?limit=1&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.offset).toBe(0);
    });

    it('должен вернуть ошибку валидации для недопустимых параметров фильтрации', async () => {
      const response = await request(app)
        .get('/api/transactions?type=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('должен получить транзакцию по ID', async () => {
      const response = await request(app)
        .get(`/api/transactions/${createdTransactionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTransactionId);
      expect(response.body.data).toMatchObject({
        type: validTransactionData.type,
        category: validTransactionData.category,
        amount: validTransactionData.amount,
        description: validTransactionData.description,
        priority: validTransactionData.priority,
        date: validTransactionData.date,
        notes: validTransactionData.notes
      });
    });

    it('должен вернуть 404 для несуществующей транзакции', async () => {
      const response = await request(app)
        .get('/api/transactions/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
      expect(response.body.error.message).toBe('Транзакция не найдена');
    });

    it('должен вернуть ошибку валидации для недопустимого ID', async () => {
      const response = await request(app)
        .get('/api/transactions/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('должен обновить транзакцию со всеми полями', async () => {
      const updateData: UpdateTransactionInput = {
        type: 'income',
        category: 'Фриланс',
        amount: 2000,
        description: 'Обновленное описание',
        priority: 'высокий',
        date: '2024-01-20',
        notes: 'Обновленная заметка'
      };

      const response = await request(app)
        .put(`/api/transactions/${createdTransactionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTransactionId);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('должен обновить транзакцию частично', async () => {
      const updateData: UpdateTransactionInput = {
        amount: 2500,
        notes: 'Частично обновленная заметка'
      };

      const response = await request(app)
        .put(`/api/transactions/${createdTransactionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdTransactionId);
      expect(response.body.data.amount).toBe(updateData.amount);
      expect(response.body.data.notes).toBe(updateData.notes);
    });

    it('должен вернуть 404 для несуществующей транзакции', async () => {
      const updateData: UpdateTransactionInput = {
        amount: 1000
      };

      const response = await request(app)
        .put('/api/transactions/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
      expect(response.body.error.message).toBe('Транзакция не найдена');
    });

    it('должен вернуть ошибку валидации для недопустимых данных обновления', async () => {
      const invalidData = { amount: -100 };

      const response = await request(app)
        .put(`/api/transactions/${createdTransactionId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('должен вернуть ошибку валидации для недопустимого ID', async () => {
      const response = await request(app)
        .put('/api/transactions/invalid')
        .send({ amount: 1000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('должен удалить транзакцию', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${createdTransactionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Транзакция успешно удалена');

      // проверяем, что транзакция удалена
      const getResponse = await request(app)
        .get(`/api/transactions/${createdTransactionId}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
      expect(getResponse.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('должен вернуть 404 для несуществующей транзакции', async () => {
      const response = await request(app)
        .delete('/api/transactions/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
      expect(response.body.error.message).toBe('Транзакция не найдена');
    });

    it('должен вернуть ошибку валидации для недопустимого ID', async () => {
      const response = await request(app)
        .delete('/api/transactions/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // этот тест требует мокать базу данных для симуляции ошибок
      // пока что тестируем с валидными данными для проверки структуры эндпоинта
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('должен корректно обрабатывать большие суммы', async () => {
      const largeAmountData = {
        ...validTransactionData,
        amount: 999999999.99
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(largeAmountData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(largeAmountData.amount);
    });

    it('должен корректно обрабатывать очень длинные описания и заметки', async () => {
      const longTextData = {
        ...validTransactionData,
        description: 'A'.repeat(500), // Max length
        notes: 'B'.repeat(1000) // Max length
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(longTextData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(longTextData.description);
      expect(response.body.data.notes).toBe(longTextData.notes);
    });

    it('должен отклонять описания и заметки, которые слишком длинные', async () => {
      const tooLongData = {
        ...validTransactionData,
        description: 'A'.repeat(501), // Over max length
        notes: 'B'.repeat(1001) // Over max length
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(tooLongData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});