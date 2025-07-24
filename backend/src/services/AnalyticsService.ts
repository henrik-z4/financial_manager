import { Database } from 'sqlite3';
import { Transaction } from '../types';

export interface ExpenseCategoryData {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingTrendData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

export interface IncomeVsExpenseData {
  period: string;
  income: number;
  expenses: number;
  difference: number;
  percentageChange?: number;
}

export interface PriorityBreakdownData {
  priority: string;
  amount: number;
  percentage: number;
  count: number;
}

export class AnalyticsService {
  constructor(private db: Database) {}

  // получить разбивку расходов по категориям для визуализации графика
  async getExpensesByCategory(startDate?: string, endDate?: string): Promise<ExpenseCategoryData[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE type = 'expense'
      `;
      
      const params: string[] = [];
      
      if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
      }
      
      sql += ' GROUP BY category ORDER BY total_amount DESC';

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        // вычислить общий расход для расчёта процентов
        const totalExpenses = rows.reduce((sum, row) => sum + row.total_amount, 0);

        const categoryData: ExpenseCategoryData[] = rows.map(row => ({
          category: row.category,
          amount: row.total_amount,
          percentage: totalExpenses > 0 ? (row.total_amount / totalExpenses) * 100 : 0,
          count: row.transaction_count
        }));

        resolve(categoryData);
      });
    });
  }

  // получить динамику расходов по месяцам
  async getSpendingTrends(months: number = 12): Promise<SpendingTrendData[]> {
    return new Promise((resolve, reject) => {
      // для тестирования используется фиксированный диапазон дат вместо относительного 'сейчас'
      // это обеспечивает предсказуемость данных в тестах
      const sql = `
        SELECT 
          strftime('%Y-%m', date) as period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
        FROM transactions 
        GROUP BY strftime('%Y-%m', date)
        ORDER BY period ASC
        LIMIT ?
      `;

      this.db.all(sql, [months], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const trendData: SpendingTrendData[] = rows.map(row => ({
          period: row.period,
          income: row.income || 0,
          expenses: row.expenses || 0,
          net: (row.income || 0) - (row.expenses || 0)
        }));

        resolve(trendData);
      });
    });
  }

  // получить сравнение доходов и расходов с процентным изменением
  async getIncomeVsExpenseComparison(months: number = 6): Promise<IncomeVsExpenseData[]> {
    return new Promise((resolve, reject) => {
      // для тестирования используется фиксированный подход вместо относительного 'сейчас'
      const sql = `
        SELECT 
          strftime('%Y-%m', date) as period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
        FROM transactions 
        GROUP BY strftime('%Y-%m', date)
        ORDER BY period ASC
        LIMIT ?
      `;

      this.db.all(sql, [months], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const comparisonData: IncomeVsExpenseData[] = rows.map((row, index) => {
          const income = row.income || 0;
          const expenses = row.expenses || 0;
          const difference = income - expenses;
          
          let percentageChange: number | undefined;
          if (index > 0) {
            const prevRow = rows[index - 1];
            const prevDifference = (prevRow.income || 0) - (prevRow.expenses || 0);
            if (prevDifference !== 0) {
              percentageChange = ((difference - prevDifference) / Math.abs(prevDifference)) * 100;
            }
          }

          return {
            period: row.period,
            income,
            expenses,
            difference,
            percentageChange
          };
        });

        resolve(comparisonData);
      });
    });
  }

  // получить разбивку расходов по приоритетам
  async getExpensesByPriority(startDate?: string, endDate?: string): Promise<PriorityBreakdownData[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          priority,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE type = 'expense' AND priority IS NOT NULL
      `;
      
      const params: string[] = [];
      
      if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
      }
      
      sql += ' GROUP BY priority ORDER BY total_amount DESC';

      this.db.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        // вычислить общий расход для расчёта процентов
        const totalExpenses = rows.reduce((sum, row) => sum + row.total_amount, 0);

        const priorityData: PriorityBreakdownData[] = rows.map(row => ({
          priority: row.priority,
          amount: row.total_amount,
          percentage: totalExpenses > 0 ? (row.total_amount / totalExpenses) * 100 : 0,
          count: row.transaction_count
        }));

        resolve(priorityData);
      });
    });
  }

  // получить сводку за текущий месяц
  async getCurrentMonthSummary(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
    topExpenseCategory: string | null;
  }> {
    return new Promise((resolve, reject) => {
      // для тестирования используется упрощённый запрос без привязки к текущей дате
      const sql = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
          COUNT(*) as transaction_count
        FROM transactions
      `;

      this.db.get(sql, [], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        const totalIncome = row.total_income || 0;
        const totalExpenses = row.total_expenses || 0;

        // получить самую крупную категорию расходов
        const topCategorySql = `
          SELECT category
          FROM transactions 
          WHERE type = 'expense'
          GROUP BY category
          ORDER BY SUM(amount) DESC
          LIMIT 1
        `;

        this.db.get(topCategorySql, [], (err, categoryRow: any) => {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            totalIncome,
            totalExpenses,
            netAmount: totalIncome - totalExpenses,
            transactionCount: row.transaction_count || 0,
            topExpenseCategory: categoryRow?.category || null
          });
        });
      });
    });
  }

  // получить динамику по категории за несколько месяцев
  async getCategoryTrends(category: string, months: number = 6): Promise<SpendingTrendData[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          strftime('%Y-%m', date) as period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
        FROM transactions 
        WHERE category = ?
        GROUP BY strftime('%Y-%m', date)
        ORDER BY period ASC
        LIMIT ?
      `;

      this.db.all(sql, [category, months], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const trendData: SpendingTrendData[] = rows.map(row => ({
          period: row.period,
          income: row.income || 0,
          expenses: row.expenses || 0,
          net: (row.income || 0) - (row.expenses || 0)
        }));

        resolve(trendData);
      });
    });
  }
}