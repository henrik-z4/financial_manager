import { databaseManager } from '../utils/database';

// инициализация тестовой базы данных перед всеми тестами
beforeAll(async () => {
  await databaseManager.initialize();
});

// закрытие соединения после всех тестов
afterAll(async () => {
  await databaseManager.close();
});