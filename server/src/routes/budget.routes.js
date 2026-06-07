import { Router } from 'express';
import { getOrCreateBudget, upsertBudget } from '../controllers/budget.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', getOrCreateBudget);
router.put('/', upsertBudget);

export default router;
