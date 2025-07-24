#!/bin/bash

echo "Установка зависимостей фронтенда..."
cd frontend
npm install tailwindcss@3.3.6 autoprefixer@10.4.16 postcss@8.4.32 @tailwindcss/forms@0.5.7

echo "Настройка Tailwind CSS..."
npx tailwindcss init -p

echo "Запуск сервера разработки..."
npm run dev