import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { logSleep, getSleepLogs, getSleepInsights } from '../controllers/sleep.controller.js';

const router = Router();
router.use(authenticate);

router.post('/',          logSleep);
router.get('/',           getSleepLogs);
router.get('/insights',   getSleepInsights);

export default router;
