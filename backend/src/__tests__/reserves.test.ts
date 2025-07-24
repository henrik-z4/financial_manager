// глобальные переменные jest доступны без импорта
import request from 'supertest';
import { Database } from 'sqlite3';
import express from 'express';
import reservesRouter from '../routes/reserves';
import { errorHandler } from '../middleware/errorHandler';
import { databaseManager } from '../utils/database';

// создаём тестовое приложение
const app = express();
app.use(express.json());
app.use('/api/reserves', reservesRouter);
app.use(errorHandler);

// тестовая база данных
let testDb: Database;

// мокируем менеджер базы данных
jest.mock('../utils/database', () => ({
  databaseManager: {
    getDatabase: jest.fn()
  }
}));

describe('Reserves API', () => {
  beforeEach(async () => {
    // создаём in-memory базу данных для тестов
    testDb = new Database(':memory:');
    
    // возвращаем тестовую базу из менеджера
    (databaseManager.getDatabase as jest.Mock).mockReturnValue(testDb);
    
    // создаём таблицу резервов
    await new Promise<void>((resolve, reject) => {
      testDb.run(`
        CREATE TABLE reserves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0,
          purpose TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterEach(async () => {
    if (testDb) {
      await new Promise<void>((resolve) => {
        testDb.close(() => resolve());
      });
    }
  });

  describe('POST /api/reserves', () => {
    it('должен создать новый резерв с валидными данными', async () => {
      const reserveData = {
        name: 'Отпуск',
        targetAmount: 50000,
        currentAmount: 10000,
        purpose: 'Отпуск в Турции'
      };

      const response = await request(app)
        .post('/api/reserves')
        .send(reserveData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(reserveData.name);
      expect(response.body.data.targetAmount).toBe(reserveData.targetAmount);
      expect(response.body.data.currentAmount).toBe(reserveData.currentAmount);
      expect(response.body.data.purpose).toBe(reserveData.purpose);
      expect(response.body.data.completionPercentage).toBe(20); // 10000/50000 * 100
      expect(response.body.data.remainingAmount).toBe(40000);
      expect(response.body.message).toBe('Резерв успешно создан');
    });

    it('должен создать резерв с текущей суммой по умолчанию', async () => {
      const reserveData = {
        name: 'Экстренный фонд',
        targetAmount: 100000
      };

      const response = await request(app)
        .post('/api/reserves')
        .send(reserveData)
        .expect(201);

      expect(response.body.data.currentAmount).toBe(0);
      expect(response.body.data.completionPercentage).toBe(0);
      expect(response.body.data.remainingAmount).toBe(100000);
    });

    it('должен вернуть ошибку валидации при отсутствии названия', async () => {
      const reserveData = {
        targetAmount: 50000
      };

      const response = await request(app)
        .post('/api/reserves')
        .send(reserveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Название резерва обязательно');
    });

    it('должен вернуть ошибку валидации для отрицательной целевой суммы', async () => {
      const reserveData = {
        name: 'Тест',
        targetAmount: -1000
      };

      const response = await request(app)
        .post('/api/reserves')
        .send(reserveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('положительным числом');
    });

    it('должен вернуть ошибку валидации для некорректной целевой суммы', async () => {
      const reserveData = {
        name: 'Тест',
        targetAmount: 'не число'
      };

      const response = await request(app)
        .post('/api/reserves')
        .send(reserveData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('должна быть числом');
    });
  });

  describe('GET /api/reserves', () => {
    beforeEach(async () => {
      // вставляем тестовые данные
      await new Promise<void>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES 
            ('Отпуск', 50000, 15000, 'Отпуск в Турции'),
            ('Экстренный фонд', 100000, 0, 'На случай непредвиденных расходов'),
            ('Новая машина', 800000, 200000, 'Покупка автомобиля')
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    it('должен вернуть все резервы с вычисляемыми полями', async () => {
      const response = await request(app)
        .get('/api/reserves')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      const vacation = response.body.data.find((r: any) => r.name === 'Отпуск');
      expect(vacation.completionPercentage).toBe(30); // 15000/50000 * 100
      expect(vacation.remainingAmount).toBe(35000);
      
      const emergency = response.body.data.find((r: any) => r.name === 'Экстренный фонд');
      expect(emergency.completionPercentage).toBe(0);
      expect(emergency.remainingAmount).toBe(100000);
      
      const car = response.body.data.find((r: any) => r.name === 'Новая машина');
      expect(car.completionPercentage).toBe(25); // 200000/800000 * 100
      expect(car.remainingAmount).toBe(600000);
    });
  });

  describe('GET /api/reserves/:id', () => {
    let reserveId: number;

    beforeEach(async () => {
      // вставляем тестовый резерв
      reserveId = await new Promise<number>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES ('Отпуск', 50000, 15000, 'Отпуск в Турции')
        `, function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });

    it('должен вернуть резерв по ID с вычисляемыми полями', async () => {
      const response = await request(app)
        .get(`/api/reserves/${reserveId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Отпуск');
      expect(response.body.data.completionPercentage).toBe(30);
      expect(response.body.data.remainingAmount).toBe(35000);
    });

    it('должен вернуть 404 для несуществующего резерва', async () => {
      const response = await request(app)
        .get('/api/reserves/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Резерв не найден');
    });

    it('должен вернуть ошибку валидации для некорректного ID', async () => {
      const response = await request(app)
        .get('/api/reserves/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('положительным числом');
    });
  });

  describe('PUT /api/reserves/:id', () => {
    let reserveId: number;

    beforeEach(async () => {
      // вставляем тестовый резерв
      reserveId = await new Promise<number>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES ('Отпуск', 50000, 15000, 'Отпуск в Турции')
        `, function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });

    it('должен обновить резерв с валидными данными', async () => {
      const updateData = {
        name: 'Отпуск в Европе',
        targetAmount: 75000,
        purpose: 'Путешествие по Европе'
      };

      const response = await request(app)
        .put(`/api/reserves/${reserveId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.targetAmount).toBe(updateData.targetAmount);
      expect(response.body.data.purpose).toBe(updateData.purpose);
      expect(response.body.data.currentAmount).toBe(15000); // Should remain unchanged
      expect(response.body.data.completionPercentage).toBe(20); // 15000/75000 * 100
      expect(response.body.message).toBe('Резерв успешно обновлен');
    });

    it('должен обновить только указанные поля', async () => {
      const updateData = {
        name: 'Новое название'
      };

      const response = await request(app)
        .put(`/api/reserves/${reserveId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.targetAmount).toBe(50000); // Should remain unchanged
      expect(response.body.data.currentAmount).toBe(15000); // Should remain unchanged
    });

    it('должен вернуть 404 для несуществующего резерва', async () => {
      const response = await request(app)
        .put('/api/reserves/999')
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.error.message).toBe('Резерв не найден');
    });
  });

  describe('DELETE /api/reserves/:id', () => {
    let reserveId: number;

    beforeEach(async () => {
      // вставляем тестовый резерв
      reserveId = await new Promise<number>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES ('Отпуск', 50000, 15000, 'Отпуск в Турции')
        `, function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });

    it('должен удалить существующий резерв', async () => {
      const response = await request(app)
        .delete(`/api/reserves/${reserveId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Резерв успешно удален');

      // проверяем, что резерв удалён
      const getResponse = await request(app)
        .get(`/api/reserves/${reserveId}`)
        .expect(404);
    });

    it('должен вернуть 404 для несуществующего резерва', async () => {
      const response = await request(app)
        .delete('/api/reserves/999')
        .expect(404);

      expect(response.body.error.message).toBe('Резерв не найден');
    });
  });

  describe('POST /api/reserves/:id/allocate', () => {
    let reserveId: number;

    beforeEach(async () => {
      // вставляем тестовый резерв
      reserveId = await new Promise<number>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES ('Отпуск', 50000, 15000, 'Отпуск в Турции')
        `, function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });

    it('должен пополнить резерв на указанную сумму', async () => {
      const allocationData = { amount: 5000 };

      const response = await request(app)
        .post(`/api/reserves/${reserveId}/allocate`)
        .send(allocationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentAmount).toBe(20000); // 15000 + 5000
      expect(response.body.data.completionPercentage).toBe(40); // 20000/50000 * 100
      expect(response.body.data.remainingAmount).toBe(30000);
      expect(response.body.message).toContain('Успешно выделено 5000 руб.');
    });

    it('должен вернуть ошибку валидации для отрицательной суммы', async () => {
      const response = await request(app)
        .post(`/api/reserves/${reserveId}/allocate`)
        .send({ amount: -1000 })
        .expect(400);

      expect(response.body.error.message).toContain('положительным числом больше 0');
    });

    it('должен вернуть 404 для несуществующего резерва', async () => {
      const response = await request(app)
        .post('/api/reserves/999/allocate')
        .send({ amount: 1000 })
        .expect(404);

      expect(response.body.error.message).toBe('Резерв не найден');
    });
  });

  describe('POST /api/reserves/:id/withdraw', () => {
    let reserveId: number;

    beforeEach(async () => {
      // вставляем тестовый резерв
      reserveId = await new Promise<number>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES ('Отпуск', 50000, 15000, 'Отпуск в Турции')
        `, function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
    });

    it('должен снять деньги с резерва', async () => {
      const withdrawalData = { amount: 5000 };

      const response = await request(app)
        .post(`/api/reserves/${reserveId}/withdraw`)
        .send(withdrawalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentAmount).toBe(10000); // 15000 - 5000
      expect(response.body.data.completionPercentage).toBe(20); // 10000/50000 * 100
      expect(response.body.data.remainingAmount).toBe(40000);
      expect(response.body.message).toContain('Успешно снято 5000 руб.');
    });

    it('должен вернуть ошибку при недостатке средств', async () => {
      const response = await request(app)
        .post(`/api/reserves/${reserveId}/withdraw`)
        .send({ amount: 20000 }) // More than available 15000
        .expect(400);

      expect(response.body.error.message).toContain('Недостаточно средств в резерве');
      expect(response.body.error.message).toContain('Доступно: 15000 руб.');
      expect(response.body.error.message).toContain('запрошено: 20000 руб.');
    });

    it('не должен позволять снимать сумму ниже нуля', async () => {
      // снимаем все доступные средства
      await request(app)
        .post(`/api/reserves/${reserveId}/withdraw`)
        .send({ amount: 15000 })
        .expect(200);

      // пытаемся снять больше
      const response = await request(app)
        .post(`/api/reserves/${reserveId}/withdraw`)
        .send({ amount: 1000 })
        .expect(400);

      expect(response.body.error.message).toContain('Недостаточно средств');
    });
  });

  describe('GET /api/reserves/summary/totals', () => {
    beforeEach(async () => {
      // вставляем тестовые данные
      await new Promise<void>((resolve, reject) => {
        testDb.run(`
          INSERT INTO reserves (name, target_amount, current_amount, purpose)
          VALUES 
            ('Отпуск', 50000, 50000, 'Полностью накоплен'),
            ('Экстренный фонд', 100000, 25000, 'Частично накоплен'),
            ('Новая машина', 800000, 0, 'Пустой резерв')
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    it('должен вернуть сводку по резервам с корректными вычислениями', async () => {
      const response = await request(app)
        .get('/api/reserves/summary/totals')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const summary = response.body.data;
      expect(summary.totalReserves).toBe(3);
      expect(summary.totalCurrentAmount).toBe(75000); // 50000 + 25000 + 0
      expect(summary.totalTargetAmount).toBe(950000); // 50000 + 100000 + 800000
      expect(summary.totalRemainingAmount).toBe(875000); // 950000 - 75000
      expect(summary.overallCompletionPercentage).toBeCloseTo(7.89, 1); // 75000/950000 * 100
      expect(summary.fullyFundedReserves).toBe(1); // Отпуск
      expect(summary.partiallyFundedReserves).toBe(1); // Экстренный фонд
      expect(summary.emptyReserves).toBe(1); // Новая машина
    });
  });

  describe('Reserve Integration with Budget Calculations', () => {
    it('должен влиять на расчёты бюджета при пополнении резерва', async () => {
      // этот тест проверяет интеграцию резервов с бюджетом
      // сама логика бюджета тестируется в budget.test.ts
      
      // создаём резерв
      const reserveResponse = await request(app)
        .post('/api/reserves')
        .send({
          name: 'Тестовый резерв',
          targetAmount: 10000,
          currentAmount: 5000
        })
        .expect(201);

      expect(reserveResponse.body.data.currentAmount).toBe(5000);
      
      // выделяем ещё денег
      const allocateResponse = await request(app)
        .post(`/api/reserves/${reserveResponse.body.data.id}/allocate`)
        .send({ amount: 2000 })
        .expect(200);

      expect(allocateResponse.body.data.currentAmount).toBe(7000);
      
      // BudgetService.calculateMonthlyBudget() должен учитывать 7000 в резервах
      // интеграция тестируется в BudgetService тестах
    });
  });
});
