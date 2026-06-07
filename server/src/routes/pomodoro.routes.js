import { Router } from 'express';
import { logSession, getSessions, getStats } from '../controllers/pomodoro.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', logSession);
router.get('/', getSessions);
router.get('/stats', getStats);

export default router;
