import { Database } from 'sqlite3';
import { 
  BudgetSettings, 
  CreateBudgetSettingsInput, 
  UpdateBudgetSettingsInput, 
  BudgetSettingsRow 
} from '../types';

export class BudgetSettingsModel {
  constructor(private db: Database) {}

  // преобразует строку из базы данных в интерфейс BudgetSettings
  private mapRowToBudgetSettings(row: BudgetSettingsRow): BudgetSettings {
    return {
      id: row.id,
      month: row.month,
      year: row.year,
      manualDailyAdjustment: row.manual_daily_adjustment,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // создать или обновить настройки бюджета для определённого месяца и года
  async createOrUpdate(input: CreateBudgetSettingsInput): Promise<BudgetSettings> {
    return new Promise((resolve, reject) => {
      // сначала пытаемся найти существующие настройки
      this.findByMonthYear(input.month, input.year)
        .then(existing => {
          if (existing) {
            // обновить существующие
            return this.update(existing.id, { 
              manualDailyAdjustment: input.manualDailyAdjustment || 0 
            });
          } else {
            // создать новые
            return this.create(input);
          }
        })
        .then(result => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Не удалось создать или обновить настройки бюджета'));
          }
        })
        .catch(reject);
    });
  }

  // создать новые настройки бюджета
  private async create(input: CreateBudgetSettingsInput): Promise<BudgetSettings> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO budget_settings (month, year, manual_daily_adjustment, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const params = [
        input.month,
        input.year,
        input.manualDailyAdjustment || 0
      ];

      const budgetModel = this;
      this.db.run(sql, params, function(err: Error | null) {
        if (err) {
          reject(err);
          return;
        }

        // получить созданные настройки бюджета
        const selectSql = 'SELECT * FROM budget_settings WHERE id = ?';
        budgetModel.db.get(selectSql, [this.lastID], (err: Error | null, row: BudgetSettingsRow) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(budgetModel.mapRowToBudgetSettings(row));
        });
      });
    });
  }

  // получить настройки бюджета по id
  async findById(id: number): Promise<BudgetSettings | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM budget_settings WHERE id = ?';
      
      this.db.get(sql, [id], (err, row: BudgetSettingsRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve(this.mapRowToBudgetSettings(row));
      });
    });
  }

  // получить настройки бюджета по месяцу и году
  async findByMonthYear(month: number, year: number): Promise<BudgetSettings | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM budget_settings WHERE month = ? AND year = ?';
      
      this.db.get(sql, [month, year], (err, row: BudgetSettingsRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve(this.mapRowToBudgetSettings(row));
      });
    });
  }

  // получить все настройки бюджета
  async findAll(): Promise<BudgetSettings[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM budget_settings ORDER BY year DESC, month DESC';
      
      this.db.all(sql, [], (err, rows: BudgetSettingsRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const settings = rows.map(row => this.mapRowToBudgetSettings(row));
        resolve(settings);
      });
    });
  }

  // обновить настройки бюджета
  async update(id: number, input: UpdateBudgetSettingsInput): Promise<BudgetSettings | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: any[] = [];

      // формируем динамический запрос на обновление
      if (input.manualDailyAdjustment !== undefined) {
        updates.push('manual_daily_adjustment = ?');
        params.push(input.manualDailyAdjustment);
      }

      if (updates.length === 0) {
        // если нет изменений, возвращаем текущую запись
        this.findById(id).then(resolve).catch(reject);
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE budget_settings SET ${updates.join(', ')} WHERE id = ?`;

      const budgetModel = this;
      this.db.run(sql, params, function(this: any, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          resolve(null); // запись не найдена
          return;
        }

        // возвращаем обновлённую запись
        budgetModel.findById(id).then(resolve).catch(reject);
      });
    });
  }

  // удалить настройки бюджета
  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM budget_settings WHERE id = ?';
      
      this.db.run(sql, [id], function(this: any, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.changes > 0);
      });
    });
  }

  // получить ручную корректировку на текущий месяц
  async getCurrentMonthAdjustment(): Promise<number> {
    const now = new Date();
    const month = now.getMonth() + 1; // месяцы в js начинаются с 0
    const year = now.getFullYear();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT manual_daily_adjustment 
        FROM budget_settings 
        WHERE month = ? AND year = ?
      `;
      
      this.db.get(sql, [month, year], (err, row: { manual_daily_adjustment: number }) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row ? row.manual_daily_adjustment : 0);
      });
    });
  }
}