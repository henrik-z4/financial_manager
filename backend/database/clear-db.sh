#!/bin/bash
# очищает базу данных для локальной разработки
DB_PATH="$(dirname "$0")/financial.db"
if [ -f "$DB_PATH" ]; then
  rm "$DB_PATH"
  echo "База данных удалена: $DB_PATH"
else
  echo "Файл базы данных не найден: $DB_PATH"
fi
