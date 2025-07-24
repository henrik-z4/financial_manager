// тесты аналитики
import request from 'supertest';
import express from 'express';
import { Database } from 'sqlite3';
import analyticsRouter from '../routes/analytics';
import { AnalyticsService } from '../services/AnalyticsService';
import { databaseManager } from '../utils/database';

const app = express();
app.use(express.json());
app.use('/analytics', analyticsRouter);

// используем реальную базу данных для тестирования
let db: Database;
let analyticsService: AnalyticsService;

beforeAll(async () => {
  await databaseManager.initialize();
  db = databaseManager.getDatabase();
  analyticsService = new AnalyticsService(db);
});

beforeEach(async () => {
  // очищаем тестовые данные перед каждым тестом
  await new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM transactions', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // вставляем тестовые данные
  const testTransactions = [
    ['expense', 'Продукты', 5000, 'Покупка продуктов', 'средний', '2024-01-15'],
    ['expense', 'Транспорт', 2000, 'Проезд', 'низкий', '2024-01-16'],
    ['expense', 'Продукты', 3000, 'Еще продукты', 'средний', '2024-01-17'],
    ['income', 'Зарплата', 50000, 'Основная зарплата', 'высокий', '2024-01-01'],
    ['expense', 'Развлечения', 4000, 'Кино', 'низкий', '2024-02-01'],
    ['income', 'Подработка', 10000, 'Фриланс', 'средний', '2024-02-05'],
    ['expense', 'Продукты', 6000, 'Продукты февраль', 'средний', '2024-02-10']
  ];

  for (const transaction of testTransactions) {
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO transactions (type, category, amount, description, priority, date) VALUES (?, ?, ?, ?, ?, ?)',
        transaction,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
});

describe('Analytics Service', () => {
  describe('getExpensesByCategory', () => {
    it('должен возвращать разбивку расходов по категориям', async () => {
      const result = await analyticsService.getExpensesByCategory();
      
      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('Продукты');
      expect(result[0].amount).toBe(14000); // 5000 + 3000 + 6000
      expect(result[0].count).toBe(3);
      expect(result[0].percentage).toBeCloseTo(70, 1); // 14000/20000 * 100
    });

    it('должен фильтровать по диапазону дат', async () => {
      const result = await analyticsService.getExpensesByCategory('2024-01-01', '2024-01-31');
      
      expect(result).toHaveLength(2);
      expect(result.find(r => r.category === 'Продукты')?.amount).toBe(8000); // только расходы за январь
    });
  });

  describe('getSpendingTrends', () => {
    it('должен возвращать месячные тренды расходов', async () => {
      const result = await analyticsService.getSpendingTrends(6);
      
      expect(result.length).toBeGreaterThan(0);
      const januaryData = result.find(r => r.period === '2024-01');
      expect(januaryData).toBeDefined();
      expect(januaryData?.income).toBe(50000);
      expect(januaryData?.expenses).toBe(10000);
      expect(januaryData?.net).toBe(40000);
    });
  });

  describe('getIncomeVsExpenseComparison', () => {
    it('должен возвращать сравнение доходов и расходов с процентными изменениями', async () => {
      const result = await analyticsService.getIncomeVsExpenseComparison(6);
      
      expect(result.length).toBeGreaterThan(0);
      const januaryData = result.find(r => r.period === '2024-01');
      expect(januaryData).toBeDefined();
      expect(januaryData?.income).toBe(50000);
      expect(januaryData?.expenses).toBe(10000);
      expect(januaryData?.difference).toBe(40000);
    });
  });

  describe('getExpensesByPriority', () => {
    it('должен возвращать разбивку расходов по приоритету', async () => {
      const result = await analyticsService.getExpensesByPriority();
      
      expect(result.length).toBeGreaterThan(0);
      const mediumPriority = result.find(r => r.priority === 'средний');
      expect(mediumPriority).toBeDefined();
      expect(mediumPriority?.amount).toBe(14000); // 5000 + 3000 + 6000
    });
  });

  describe('getCurrentMonthSummary', () => {
    it('должен возвращать сводку за текущий месяц', async () => {
      const result = await analyticsService.getCurrentMonthSummary();
      
      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('netAmount');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('topExpenseCategory');
    });
  });

  describe('getCategoryTrends', () => {
    it('должен возвращать тренды по выбранной категории', async () => {
      const result = await analyticsService.getCategoryTrends('Продукты', 6);
      
      expect(result.length).toBeGreaterThan(0);
      const januaryData = result.find(r => r.period === '2024-01');
      expect(januaryData).toBeDefined();
      expect(januaryData?.expenses).toBe(8000); // расходы на продукты за январь
    });
  });
});

describe('Analytics API Endpoints', () => {
  describe('GET /analytics/expenses', () => {
    it('должен возвращать аналитику расходов', async () => {
      const response = await request(app)
        .get('/analytics/expenses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('category');
      expect(response.body.data[0]).toHaveProperty('amount');
      expect(response.body.data[0]).toHaveProperty('percentage');
      expect(response.body.data[0]).toHaveProperty('count');
    });

    it('должен принимать параметры диапазона дат', async () => {
      const response = await request(app)
        .get('/analytics/expenses?startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /analytics/trends', () => {
    it('должен возвращать тренды расходов', async () => {
      const response = await request(app)
        .get('/analytics/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('period');
      expect(response.body.data[0]).toHaveProperty('income');
      expect(response.body.data[0]).toHaveProperty('expenses');
      expect(response.body.data[0]).toHaveProperty('net');
    });

    it('должен принимать параметр месяцев', async () => {
      const response = await request(app)
        .get('/analytics/trends?months=3')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('должен валидировать параметр месяцев', async () => {
      const response = await request(app)
        .get('/analytics/trends?months=100')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('GET /analytics/comparison', () => {
    it('должен возвращать сравнение доходов и расходов', async () => {
      const response = await request(app)
        .get('/analytics/comparison')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('period');
      expect(response.body.data[0]).toHaveProperty('income');
      expect(response.body.data[0]).toHaveProperty('expenses');
      expect(response.body.data[0]).toHaveProperty('difference');
    });

    it('должен валидировать параметр месяцев', async () => {
      const response = await request(app)
        .get('/analytics/comparison?months=50')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('GET /analytics/priority', () => {
    it('должен возвращать разбивку по приоритету', async () => {
      const response = await request(app)
        .get('/analytics/priority')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('priority');
      expect(response.body.data[0]).toHaveProperty('amount');
      expect(response.body.data[0]).toHaveProperty('percentage');
      expect(response.body.data[0]).toHaveProperty('count');
    });
  });

  describe('GET /analytics/summary', () => {
    it('должен возвращать сводку за месяц', async () => {
      const response = await request(app)
        .get('/analytics/summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalIncome');
      expect(response.body.data).toHaveProperty('totalExpenses');
      expect(response.body.data).toHaveProperty('netAmount');
      expect(response.body.data).toHaveProperty('transactionCount');
      expect(response.body.data).toHaveProperty('topExpenseCategory');
    });
  });

  describe('GET /analytics/category-trends/:category', () => {
    it('должен возвращать тренды по категории', async () => {
      const response = await request(app)
        .get('/analytics/category-trends/Продукты')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('period');
      expect(response.body.data[0]).toHaveProperty('income');
      expect(response.body.data[0]).toHaveProperty('expenses');
      expect(response.body.data[0]).toHaveProperty('net');
    });

    it('должен валидировать параметр месяцев', async () => {
      const response = await request(app)
        .get('/analytics/category-trends/Продукты?months=50')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
  });
});