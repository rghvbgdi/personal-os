import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getTodayDashboard } from '../controllers/todoDashboard.controller.js';

const router = Router();
router.use(authenticate);

router.get('/today', getTodayDashboard);

export default router;
