import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../database/financial.db');
const DB_DIR = path.dirname(DB_PATH);

// включить подробный режим для отладки
sqlite3.verbose();

// директория базы данных существует иль нет
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

class DatabaseManager {
  private db: sqlite3.Database | null = null;
  private isInitialized = false;

  async connect(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve(this.db!);
        }
      });
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    if (!this.db) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const tables = [
        this.createTransactionsTable(),
        this.createReservesTable(),
        this.createBudgetSettingsTable()
      ];

      Promise.all(tables)
        .then(() => this.createIndexes())
        .then(() => {
          this.isInitialized = true;
          console.log('Database tables and indexes initialized successfully');
          resolve();
        })
        .catch(reject);
    });
  }

  private createTransactionsTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          priority TEXT CHECK(priority IN ('низкий', 'средний', 'максимальный', 'высокий', 'целевой')),
          date DATE NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db!.run(sql, (err) => {
        if (err) {
          console.error('Error creating transactions table:', err.message);
          reject(err);
        } else {
          console.log('Transactions table created/verified');
          resolve();
        }
      });
    });
  }

  private createReservesTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS reserves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          current_amount REAL DEFAULT 0,
          purpose TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.db!.run(sql, (err) => {
        if (err) {
          console.error('Error creating reserves table:', err.message);
          reject(err);
        } else {
          console.log('Reserves table created/verified');
          resolve();
        }
      });
    });
  }

  private createBudgetSettingsTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS budget_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          manual_daily_adjustment REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(month, year)
        )
      `;
      
      this.db!.run(sql, (err) => {
        if (err) {
          console.error('Error creating budget_settings table:', err.message);
          reject(err);
        } else {
          console.log('Budget settings table created/verified');
          resolve();
        }
      });
    });
  }

  private createIndexes(): Promise<void> {
    return new Promise((resolve, reject) => {
      const indexes = [
        // создать индекс по дате транзакции
        'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
        // создать индекс по типу транзакции
        'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
        // создать индекс по категории транзакции
        'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)',
        // создать индекс по месяцу и году в настройках бюджета
        'CREATE INDEX IF NOT EXISTS idx_budget_settings_month_year ON budget_settings(month, year)'
      ];

      let completed = 0;
      let hasError = false;

      indexes.forEach((indexSql) => {
        this.db!.run(indexSql, (err) => {
          if (err && !hasError) {
            hasError = true;
            console.error('Error creating index:', err.message);
            reject(err);
            return;
          }
          
          completed++;
          if (completed === indexes.length && !hasError) {
            console.log('Database indexes created/verified');
            resolve();
          }
        });
      });
    });
  }

  getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
            reject(err);
          } else {
            console.log('Database connection closed');
            this.db = null;
            this.isInitialized = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// создать синглтон экземпляр
const dbManager = new DatabaseManager();

// инициализировать базу данных при загрузке модуля
dbManager.initialize().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// экспортировать экземпляр базы данных и менеджер
export const db = dbManager.getDatabase();
export const databaseManager = dbManager;
export default db;