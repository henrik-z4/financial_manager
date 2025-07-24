import { Database } from 'sqlite3';
import { TransactionModel } from '../models/Transaction';
import { ReserveModel } from '../models/Reserve';
import { BudgetSettingsModel } from '../models/BudgetSettings';
import { BudgetCalculation } from '../types';

export class BudgetService {
  private transactionModel: TransactionModel;
  private reserveModel: ReserveModel;
  private budgetSettingsModel: BudgetSettingsModel;

  constructor(db: Database) {
    this.transactionModel = new TransactionModel(db);
    this.reserveModel = new ReserveModel(db);
    this.budgetSettingsModel = new BudgetSettingsModel(db);
  }

  // вычисляет бюджет за конкретный месяц и год
  async calculateMonthlyBudget(month: number, year: number): Promise<BudgetCalculation> {
    // получить начальную и конечную дату месяца
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    // получить общий доход и расходы за месяц
    const totalIncome = await this.transactionModel.getTotalByTypeAndDateRange('income', startDate, endDate);
    const totalExpenses = await this.transactionModel.getTotalByTypeAndDateRange('expense', startDate, endDate);
    
    // получить сумму всех резервов
    const totalReserves = await this.reserveModel.getTotalCurrentAmount();
    
    // вычислить оставшийся бюджет
    const remainingBudget = totalIncome - totalExpenses - totalReserves;
    
    // вычислить количество оставшихся дней в месяце
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let daysLeftInMonth: number;
    if (year === currentYear && month === currentMonth) {
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const currentDay = today.getDate();
      daysLeftInMonth = Math.max(1, lastDayOfMonth - currentDay + 1);
    } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
      // будущий месяц - все дни доступны
      daysLeftInMonth = new Date(year, month, 0).getDate();
    } else {
      // прошедший месяц - дней не осталось
      daysLeftInMonth = 0;
    }
    
    // вычислить базовый дневной лимит расходов
    const basicDailyLimit = daysLeftInMonth > 0 ? remainingBudget / daysLeftInMonth : 0;
    
    // получить ручную корректировку на этот месяц
    const budgetSettings = await this.budgetSettingsModel.findByMonthYear(month, year);
    const manualAdjustment = budgetSettings ? budgetSettings.manualDailyAdjustment : 0;
    
    // вычислить сумму перерасхода (если есть)
    const overspendAmount = Math.max(0, -remainingBudget);
    
    // вычислить скорректированный дневной лимит
    const adjustedDailyLimit = Math.max(0, basicDailyLimit + manualAdjustment);
    
    return {
      totalIncome,
      totalExpenses,
      totalReserves,
      remainingBudget,
      dailySpendingLimit: basicDailyLimit,
      daysLeftInMonth,
      overspendAmount,
      adjustedDailyLimit
    };
  }

  // вычисляет бюджет за текущий месяц
  async calculateCurrentMonthBudget(): Promise<BudgetCalculation> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    return this.calculateMonthlyBudget(month, year);
  }

  // вычисляет корректировку дневных расходов на основе последних трат
  async calculateDailySpendingAdjustment(month: number, year: number): Promise<number> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // вычислять только для текущего месяца
    if (year !== currentYear || month !== currentMonth) {
      return 0;
    }
    
    // получить расходы с начала месяца по сегодня
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    const spentSoFar = await this.transactionModel.getTotalByTypeAndDateRange('expense', startOfMonth, today);
    
    // получить расчет бюджета
    const budget = await this.calculateMonthlyBudget(month, year);
    
    // вычислить ожидаемые расходы на текущую дату
    const daysPassed = now.getDate();
    const expectedSpending = budget.dailySpendingLimit * daysPassed;
    
    // вычислить необходимую корректировку
    const overspend = spentSoFar - expectedSpending;
    
    // распределить перерасход по оставшимся дням
    if (overspend > 0 && budget.daysLeftInMonth > 0) {
      return -(overspend / budget.daysLeftInMonth);
    }
    
    // если недотрачено, добавить остаток к оставшимся дням
    if (overspend < 0 && budget.daysLeftInMonth > 0) {
      return -(overspend / budget.daysLeftInMonth);
    }
    
    return 0;
  }

  // установить ручную корректировку дневного лимита для месяца
  async setManualDailyAdjustment(month: number, year: number, adjustment: number): Promise<void> {
    await this.budgetSettingsModel.createOrUpdate({
      month,
      year,
      manualDailyAdjustment: adjustment
    });
  }

  // получить сводку расходов за период
  async getSpendingSummary(startDate: string, endDate: string) {
    const transactions = await this.transactionModel.findByDateRange(startDate, endDate);
    
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: transactions.length,
      categoryBreakdown: {} as Record<string, { income: number; expense: number; count: number }>,
      priorityBreakdown: {} as Record<string, { income: number; expense: number; count: number }>
    };
    
    transactions.forEach(transaction => {
      // обновить общие суммы
      if (transaction.type === 'income') {
        summary.totalIncome += transaction.amount;
      } else {
        summary.totalExpenses += transaction.amount;
      }
      
      // обновить разбивку по категориям
      if (!summary.categoryBreakdown[transaction.category]) {
        summary.categoryBreakdown[transaction.category] = { income: 0, expense: 0, count: 0 };
      }
      
      if (transaction.type === 'income') {
        summary.categoryBreakdown[transaction.category].income += transaction.amount;
      } else {
        summary.categoryBreakdown[transaction.category].expense += transaction.amount;
      }
      summary.categoryBreakdown[transaction.category].count++;
      
      // обновить разбивку по приоритету
      if (!summary.priorityBreakdown[transaction.priority]) {
        summary.priorityBreakdown[transaction.priority] = { income: 0, expense: 0, count: 0 };
      }
      
      if (transaction.type === 'income') {
        summary.priorityBreakdown[transaction.priority].income += transaction.amount;
      } else {
        summary.priorityBreakdown[transaction.priority].expense += transaction.amount;
      }
      summary.priorityBreakdown[transaction.priority].count++;
    });
    
    return summary;
  }

  // получить месячные тренды расходов за последние N месяцев
  async getSpendingTrends(monthsBack: number = 12) {
    const trends = [];
    const now = new Date();
    
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const totalIncome = await this.transactionModel.getTotalByTypeAndDateRange('income', startDate, endDate);
      const totalExpenses = await this.transactionModel.getTotalByTypeAndDateRange('expense', startDate, endDate);
      
      trends.unshift({
        month,
        year,
        monthName: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses
      });
    }
    
    return trends;
  }
}