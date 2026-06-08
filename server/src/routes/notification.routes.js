import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { subscribe, sendTest, getPending, getVapidKey } from '../controllers/notification.controller.js';

const router = Router();
router.use(authenticate);

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', subscribe);
router.post('/test',      sendTest);
router.get('/pending',    getPending);

export default router;
