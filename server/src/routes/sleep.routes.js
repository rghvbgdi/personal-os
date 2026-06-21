import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { logSleep, getSleepLogs, getSleepInsights, updateSleep, deleteSleep } from '../controllers/sleep.controller.js';

const router = Router();
router.use(authenticate);

router.post('/',          logSleep);
router.get('/',           getSleepLogs);
router.get('/insights',   getSleepInsights);
router.patch('/:id',      updateSleep);
router.delete('/:id',     deleteSleep);

export default router;
