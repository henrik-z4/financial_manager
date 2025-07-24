#!/bin/bash

echo "🧹 Удаление файлов базы данных..."
rm -f backend/database/financial.db
rm -f backend/database.sqlite

echo "🔄 Перезапуск сервера бэкенда..."
cd backend
npm run dev