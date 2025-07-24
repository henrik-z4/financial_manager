// тесты бюджета
import { Database } from 'sqlite3';
import { BudgetService } from '../services/BudgetService';
import { TransactionModel } from '../models/Transaction';
import { ReserveModel } from '../models/Reserve';
import { BudgetSettingsModel } from '../models/BudgetSettings';
import { databaseManager } from '../utils/database';

describe('BudgetService', () => {
  let db: Database;
  let budgetService: BudgetService;
  let transactionModel: TransactionModel;
  let reserveModel: ReserveModel;
  let budgetSettingsModel: BudgetSettingsModel;

  beforeAll(async () => {
    await databaseManager.initialize();
    db = databaseManager.getDatabase();
    budgetService = new BudgetService(db);
    transactionModel = new TransactionModel(db);
    reserveModel = new ReserveModel(db);
    budgetSettingsModel = new BudgetSettingsModel(db);
  });

  beforeEach(async () => {
    // очищаем тестовые данные перед каждым тестом
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM transactions', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM reserves', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM budget_settings', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('calculateMonthlyBudget', () => {
    it('должен корректно рассчитывать бюджет за текущий месяц с доходами, расходами и резервами', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      // создаём тестовые данные
      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 50000,
        description: 'Месячная зарплата',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 15000,
        description: 'Покупка продуктов',
        priority: 'средний',
        date: `${year}-${month.toString().padStart(2, '0')}-05`
      });

      await reserveModel.create({
        name: 'Отпуск',
        targetAmount: 100000,
        currentAmount: 10000,
        purpose: 'Летний отпуск'
      });

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.totalIncome).toBe(50000);
      expect(result.totalExpenses).toBe(15000);
      expect(result.totalReserves).toBe(10000);
      expect(result.remainingBudget).toBe(25000); // 50000 - 15000 - 10000
      expect(result.daysLeftInMonth).toBeGreaterThan(0);
      expect(result.dailySpendingLimit).toBeGreaterThan(0);
      expect(result.overspendAmount).toBe(0);
      expect(result.adjustedDailyLimit).toBe(result.dailySpendingLimit);
    });

    it('должен корректно рассчитывать бюджет за будущий месяц', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 2);
      const month = futureDate.getMonth() + 1;
      const year = futureDate.getFullYear();

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.remainingBudget).toBeLessThanOrEqual(0); // только резервы вычтены
      expect(result.daysLeftInMonth).toBe(new Date(year, month, 0).getDate()); // все дни доступны
    });

    it('должен корректно рассчитывать бюджет за прошлый месяц', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);
      const month = pastDate.getMonth() + 1;
      const year = pastDate.getFullYear();

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.daysLeftInMonth).toBe(0); // нет оставшихся дней в прошлом месяце
      expect(result.dailySpendingLimit).toBe(0);
    });

    it('должен корректно обрабатывать ситуацию перерасхода', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // создаём ситуацию, когда расходы превышают доходы
      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 30000,
        description: 'Месячная зарплата',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 40000,
        description: 'Большие расходы',
        priority: 'средний',
        date: `${year}-${month.toString().padStart(2, '0')}-05`
      });

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.totalIncome).toBe(30000);
      expect(result.totalExpenses).toBe(40000);
      expect(result.remainingBudget).toBeLessThan(0);
      expect(result.overspendAmount).toBe(10000); // 40000 - 30000
      expect(result.dailySpendingLimit).toBeLessThan(0);
      expect(result.adjustedDailyLimit).toBe(0); // должно быть max(0, отрицательное значение)
    });

    it('должен корректно применять ручную корректировку дневного лимита', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // создаём настройки бюджета с ручной корректировкой
      await budgetSettingsModel.createOrUpdate({
        month,
        year,
        manualDailyAdjustment: 500
      });

      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 50000,
        description: 'Месячная зарплата',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.adjustedDailyLimit).toBe(result.dailySpendingLimit + 500);
    });
  });

  describe('calculateCurrentMonthBudget', () => {
    it('должен рассчитывать бюджет за текущий месяц', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 45000,
        description: 'Месячная зарплата',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      const result = await budgetService.calculateCurrentMonthBudget();

      expect(result.totalIncome).toBe(45000);
      expect(result.daysLeftInMonth).toBeGreaterThan(0);
    });
  });

  describe('calculateDailySpendingAdjustment', () => {
    it('должен рассчитывать корректировку дневного лимита при перерасходе в текущем месяце', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const today = currentDate.getDate();

      // создаём доход
      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 60000,
        description: 'Месячная зарплата',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      // создаём превышение расходов за текущий период
      const dailyBudget = 60000 / new Date(year, month, 0).getDate();
      const expectedSpending = dailyBudget * today;
      const actualSpending = expectedSpending + 5000; // перерасход на 5000

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: actualSpending,
        description: 'Большие расходы',
        priority: 'средний',
        date: `${year}-${month.toString().padStart(2, '0')}-${today.toString().padStart(2, '0')}`
      });

      const adjustment = await budgetService.calculateDailySpendingAdjustment(month, year);

      expect(adjustment).toBeLessThan(0); // должно быть отрицательное значение для уменьшения лимита
    });

    it('должен возвращать 0 корректировку для прошлых месяцев', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      const month = pastDate.getMonth() + 1;
      const year = pastDate.getFullYear();

      const adjustment = await budgetService.calculateDailySpendingAdjustment(month, year);

      expect(adjustment).toBe(0);
    });

    it('должен возвращать 0 корректировку для будущих месяцев', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const month = futureDate.getMonth() + 1;
      const year = futureDate.getFullYear();

      const adjustment = await budgetService.calculateDailySpendingAdjustment(month, year);

      expect(adjustment).toBe(0);
    });
  });

  describe('setManualDailyAdjustment', () => {
    it('должен создавать новые настройки бюджета с ручной корректировкой', async () => {
      const month = 6;
      const year = 2024;
      const adjustment = 750;

      await budgetService.setManualDailyAdjustment(month, year, adjustment);

      const settings = await budgetSettingsModel.findByMonthYear(month, year);
      expect(settings).toBeDefined();
      expect(settings!.manualDailyAdjustment).toBe(adjustment);
    });

    it('должен обновлять существующие настройки бюджета', async () => {
      const month = 7;
      const year = 2024;

      // создаём начальные настройки
      await budgetSettingsModel.createOrUpdate({
        month,
        year,
        manualDailyAdjustment: 500
      });

      // обновляем новой корректировкой
      await budgetService.setManualDailyAdjustment(month, year, 1000);

      const settings = await budgetSettingsModel.findByMonthYear(month, year);
      expect(settings!.manualDailyAdjustment).toBe(1000);
    });
  });

  describe('getSpendingSummary', () => {
    it('должен корректно рассчитывать сводку расходов', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      // создаём тестовые транзакции
      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 50000,
        description: 'Зарплата',
        priority: 'высокий',
        date: '2024-01-01'
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 15000,
        description: 'Продукты',
        priority: 'средний',
        date: '2024-01-15'
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Транспорт',
        amount: 5000,
        description: 'Бензин',
        priority: 'низкий',
        date: '2024-01-20'
      });

      const summary = await budgetService.getSpendingSummary(startDate, endDate);

      expect(summary.totalIncome).toBe(50000);
      expect(summary.totalExpenses).toBe(20000);
      expect(summary.transactionCount).toBe(3);
      expect(summary.categoryBreakdown['Зарплата']).toEqual({
        income: 50000,
        expense: 0,
        count: 1
      });
      expect(summary.categoryBreakdown['Продукты']).toEqual({
        income: 0,
        expense: 15000,
        count: 1
      });
      expect(summary.priorityBreakdown['высокий']).toEqual({
        income: 50000,
        expense: 0,
        count: 1
      });
      expect(summary.priorityBreakdown['средний']).toEqual({
        income: 0,
        expense: 15000,
        count: 1
      });
    });

    it('должен корректно обрабатывать пустой диапазон дат', async () => {
      const summary = await budgetService.getSpendingSummary('2024-12-01', '2024-12-31');

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(Object.keys(summary.categoryBreakdown)).toHaveLength(0);
      expect(Object.keys(summary.priorityBreakdown)).toHaveLength(0);
    });
  });

  describe('getSpendingTrends', () => {
    it('должен рассчитывать динамику расходов за указанные месяцы', async () => {
      // создаём транзакции для разных месяцев
      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 50000,
        description: 'Зарплата январь',
        priority: 'высокий',
        date: '2024-01-01'
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 15000,
        description: 'Продукты январь',
        priority: 'средний',
        date: '2024-01-15'
      });

      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 55000,
        description: 'Зарплата февраль',
        priority: 'высокий',
        date: '2024-02-01'
      });

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 18000,
        description: 'Продукты февраль',
        priority: 'средний',
        date: '2024-02-15'
      });

      const trends = await budgetService.getSpendingTrends(3);

      expect(trends).toHaveLength(3);
      expect(trends[0].totalIncome).toBeGreaterThanOrEqual(0);
      expect(trends[0].totalExpenses).toBeGreaterThanOrEqual(0);
      expect(trends[0].netAmount).toBe(trends[0].totalIncome - trends[0].totalExpenses);
      expect(trends[0]).toHaveProperty('month');
      expect(trends[0]).toHaveProperty('year');
      expect(trends[0]).toHaveProperty('monthName');
    });

    it('должен по умолчанию возвращать динамику за 12 месяцев', async () => {
      const trends = await budgetService.getSpendingTrends();

      expect(trends).toHaveLength(12);
    });

    it('должен возвращать динамику в хронологическом порядке', async () => {
      const trends = await budgetService.getSpendingTrends(6);

      for (let i = 1; i < trends.length; i++) {
        const current = new Date(trends[i].year, trends[i].month - 1);
        const previous = new Date(trends[i - 1].year, trends[i - 1].month - 1);
        expect(current.getTime()).toBeGreaterThan(previous.getTime());
      }
    });
  });

  describe('Edge Cases', () => {
    it('должен корректно обрабатывать ситуацию с нулевым доходом', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      await transactionModel.create({
        type: 'expense',
        category: 'Продукты',
        amount: 5000,
        description: 'Расходы без дохода',
        priority: 'средний',
        date: `${year}-${month.toString().padStart(2, '0')}-05`
      });

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(5000);
      expect(result.remainingBudget).toBeLessThan(0);
      expect(result.overspendAmount).toBeGreaterThan(0);
    });

    it('должен корректно обрабатывать ситуацию с нулевыми резервами', async () => {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      await transactionModel.create({
        type: 'income',
        category: 'Зарплата',
        amount: 40000,
        description: 'Доход без резервов',
        priority: 'высокий',
        date: `${year}-${month.toString().padStart(2, '0')}-01`
      });

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.totalReserves).toBe(0);
      expect(result.remainingBudget).toBe(40000);
    });

    it('должен корректно обрабатывать последний день месяца', async () => {
      const lastDayOfMonth = new Date();
      lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1, 0); // последний день текущего месяца
      
      const month = lastDayOfMonth.getMonth() + 1;
      const year = lastDayOfMonth.getFullYear();

      const result = await budgetService.calculateMonthlyBudget(month, year);

      expect(result.daysLeftInMonth).toBeGreaterThanOrEqual(1);
    });
  });
});
