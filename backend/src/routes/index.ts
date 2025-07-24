import { Router } from 'express';
import transactionsRouter from './transactions';
import budgetRouter from './budget';
import analyticsRouter from './analytics';
import reservesRouter from './reserves';

const router = Router();

// подключение всех модулей маршрутов
router.use('/transactions', transactionsRouter);
router.use('/budget', budgetRouter);
router.use('/analytics', analyticsRouter);
router.use('/reserves', reservesRouter);

// endpoint для проверки состояния сервиса
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API финансового управления работает',
    timestamp: new Date().toISOString()
  });
});

export default router;