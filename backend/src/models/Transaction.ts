import { Database } from 'sqlite3';
import { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransactionInput, 
  TransactionRow, 
  TransactionFilters,
  PaginatedResponse 
} from '../types';

export class TransactionModel {
  constructor(private db: Database) {}

  // преобразование строки базы данных в интерфейс Transaction
  private mapRowToTransaction(row: TransactionRow): Transaction {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      amount: row.amount,
      description: row.description,
      priority: row.priority,
      date: row.date,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // создание новой транзакции
  async create(input: CreateTransactionInput): Promise<Transaction> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO transactions (type, category, amount, description, priority, date, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const params = [
        input.type,
        input.category,
        input.amount,
        input.description,
        input.priority,
        input.date,
        input.notes || null
      ];

      const transactionModel = this;
      this.db.run(sql, params, function(this: any, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }

        const insertId = this.lastID;

        // получение созданной транзакции
        const selectSql = 'SELECT * FROM transactions WHERE id = ?';
        transactionModel.db.get(selectSql, [insertId], (err: Error | null, row: TransactionRow) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(transactionModel.mapRowToTransaction(row));
        });
      });
    });
  }

  // получение транзакции по ID
  async findById(id: number): Promise<Transaction | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM transactions WHERE id = ?';
      
      this.db.get(sql, [id], (err, row: TransactionRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve(this.mapRowToTransaction(row));
      });
    });
  }

  // получение всех транзакций с фильтрацией и пагинацией
  async findAll(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM transactions WHERE 1=1';
      let countSql = 'SELECT COUNT(*) as total FROM transactions WHERE 1=1';
      const params: any[] = [];
      const countParams: any[] = [];

      // применение фильтров
      if (filters.type) {
        sql += ' AND type = ?';
        countSql += ' AND type = ?';
        params.push(filters.type);
        countParams.push(filters.type);
      }

      if (filters.category) {
        sql += ' AND category = ?';
        countSql += ' AND category = ?';
        params.push(filters.category);
        countParams.push(filters.category);
      }

      if (filters.priority) {
        sql += ' AND priority = ?';
        countSql += ' AND priority = ?';
        params.push(filters.priority);
        countParams.push(filters.priority);
      }

      if (filters.dateFrom) {
        sql += ' AND date >= ?';
        countSql += ' AND date >= ?';
        params.push(filters.dateFrom);
        countParams.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        sql += ' AND date <= ?';
        countSql += ' AND date <= ?';
        params.push(filters.dateTo);
        countParams.push(filters.dateTo);
      }

      if (filters.search) {
        sql += ' AND (description LIKE ? OR notes LIKE ? OR category LIKE ?)';
        countSql += ' AND (description LIKE ? OR notes LIKE ? OR category LIKE ?)';
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      // добавление сортировки
      sql += ' ORDER BY date DESC, created_at DESC';

      // добавление пагинации
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // сначала получение общего количества
      this.db.get(countSql, countParams, (err, countRow: { total: number }) => {
        if (err) {
          reject(err);
          return;
        }

        const total = countRow.total;

        // затем получение данных
        this.db.all(sql, params, (err, rows: TransactionRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          const transactions = rows.map(row => this.mapRowToTransaction(row));
          
          resolve({
            items: transactions,
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          });
        });
      });
    });
  }

  // обновление транзакции
  async update(id: number, input: UpdateTransactionInput): Promise<Transaction | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: any[] = [];

      // построение динамического запроса на обновление
      if (input.type !== undefined) {
        updates.push('type = ?');
        params.push(input.type);
      }
      if (input.category !== undefined) {
        updates.push('category = ?');
        params.push(input.category);
      }
      if (input.amount !== undefined) {
        updates.push('amount = ?');
        params.push(input.amount);
      }
      if (input.description !== undefined) {
        updates.push('description = ?');
        params.push(input.description);
      }
      if (input.priority !== undefined) {
        updates.push('priority = ?');
        params.push(input.priority);
      }
      if (input.date !== undefined) {
        updates.push('date = ?');
        params.push(input.date);
      }
      if (input.notes !== undefined) {
        updates.push('notes = ?');
        params.push(input.notes);
      }

      if (updates.length === 0) {
        // если обновлений нет, возвращаем текущую запись
        this.findById(id).then(resolve).catch(reject);
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // проверка, были ли затронуты строки
        // примечание: мы всегда будем получать запись
        this.findById(id).then(resolve).catch(reject);
      });
    });
  }

  // удаление транзакции
  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM transactions WHERE id = ?';
      
      this.db.run(sql, [id], function(this: any, err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.changes > 0);
      });
    });
  }

  // получение транзакций по диапазону дат (полезно для расчетов бюджета)
  async findByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM transactions 
        WHERE date >= ? AND date <= ?
        ORDER BY date DESC, created_at DESC
      `;
      
      this.db.all(sql, [startDate, endDate], (err, rows: TransactionRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const transactions = rows.map(row => this.mapRowToTransaction(row));
        resolve(transactions);
      });
    });
  }

  // получение транзакций по типу и диапазону дат
  async findByTypeAndDateRange(type: 'income' | 'expense', startDate: string, endDate: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM transactions 
        WHERE type = ? AND date >= ? AND date <= ?
        ORDER BY date DESC, created_at DESC
      `;
      
      this.db.all(sql, [type, startDate, endDate], (err, rows: TransactionRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const transactions = rows.map(row => this.mapRowToTransaction(row));
        resolve(transactions);
      });
    });
  }

  // получение общего количества по типу и диапазону дат
  async getTotalByTypeAndDateRange(type: 'income' | 'expense', startDate: string, endDate: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions 
        WHERE type = ? AND date >= ? AND date <= ?
      `;
      
      this.db.get(sql, [type, startDate, endDate], (err, row: { total: number }) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row.total);
      });
    });
  }
}