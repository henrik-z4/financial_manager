import { Database } from 'sqlite3';
import { 
  Reserve, 
  CreateReserveInput, 
  UpdateReserveInput, 
  ReserveRow 
} from '../types';

export class ReserveModel {
  constructor(private db: Database) {}

  // преобразует строку из базы данных в интерфейс Reserve
  private mapRowToReserve(row: ReserveRow): Reserve {
    if (!row) {
      throw new Error('Cannot map undefined row to Reserve');
    }
    return {
      id: row.id,
      name: row.name,
      targetAmount: row.target_amount,
      currentAmount: row.current_amount,
      purpose: row.purpose,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // создать новый резервный фонд
  async create(input: CreateReserveInput): Promise<Reserve> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO reserves (name, target_amount, current_amount, purpose, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const params = [
        input.name,
        input.targetAmount,
        input.currentAmount || 0,
        input.purpose || null
      ];

      const db = this.db;
      const mapRowToReserve = this.mapRowToReserve.bind(this);
      
      db.run(sql, params, function(err: Error | null) {
        if (err) {
          reject(err);
          return;
        }

        // получить созданный резерв по this.lastID из колбэка run
        const insertId = this.lastID;
        const selectSql = 'SELECT * FROM reserves WHERE id = ?';
        db.get(selectSql, [insertId], (err: Error | null, row: ReserveRow) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            reject(new Error('Failed to retrieve created reserve'));
            return;
          }
          resolve(mapRowToReserve(row));
        });
      });
    });
  }

  // получить резерв по id
  async findById(id: number): Promise<Reserve | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM reserves WHERE id = ?';
      
      this.db.get(sql, [id], (err, row: ReserveRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }
        
        resolve(this.mapRowToReserve(row));
      });
    });
  }

  // получить все резервы
  async findAll(): Promise<Reserve[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM reserves ORDER BY created_at DESC';
      
      this.db.all(sql, [], (err, rows: ReserveRow[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const reserves = rows.map(row => this.mapRowToReserve(row));
        resolve(reserves);
      });
    });
  }

  // обновить резерв
  async update(id: number, input: UpdateReserveInput): Promise<Reserve | null> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: any[] = [];

      // формирует динамический запрос на обновление
      if (input.name !== undefined) {
        updates.push('name = ?');
        params.push(input.name);
      }
      if (input.targetAmount !== undefined) {
        updates.push('target_amount = ?');
        params.push(input.targetAmount);
      }
      if (input.currentAmount !== undefined) {
        updates.push('current_amount = ?');
        params.push(input.currentAmount);
      }
      if (input.purpose !== undefined) {
        updates.push('purpose = ?');
        params.push(input.purpose);
      }

      if (updates.length === 0) {
        // если нет изменений, возвращает текущую запись
        this.findById(id).then(resolve).catch(reject);
        return;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const sql = `UPDATE reserves SET ${updates.join(', ')} WHERE id = ?`;

      this.db.run(sql, params, (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // возвращает обновленную запись
        this.findById(id).then(resolve).catch(reject);
      });
    });
  }

  // удалить резерв
  async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM reserves WHERE id = ?';
      
      this.db.run(sql, [id], function(err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(this.changes > 0);
      });
    });
  }

  // получить общую сумму по всем резервам (current_amount)
  async getTotalCurrentAmount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COALESCE(SUM(current_amount), 0) as total FROM reserves';
      
      this.db.get(sql, [], (err, row: { total: number }) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row.total);
      });
    });
  }

  // получить общую целевую сумму по всем резервам (target_amount)
  async getTotalTargetAmount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT COALESCE(SUM(target_amount), 0) as total FROM reserves';
      
      this.db.get(sql, [], (err, row: { total: number }) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(row.total);
      });
    });
  }

  // добавить сумму к резерву (для пополнения резерва)
  async addAmount(id: number, amount: number): Promise<Reserve | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE reserves 
        SET current_amount = current_amount + ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(sql, [amount, id], (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // возвращает обновленную запись
        this.findById(id).then(resolve).catch(reject);
      });
    });
  }

  // вычесть сумму из резерва (для использования средств резерва)
  async subtractAmount(id: number, amount: number): Promise<Reserve | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE reserves 
        SET current_amount = MAX(0, current_amount - ?), updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      this.db.run(sql, [amount, id], (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        // возвращает обновленную запись
        this.findById(id).then(resolve).catch(reject);
      });
    });
  }
}