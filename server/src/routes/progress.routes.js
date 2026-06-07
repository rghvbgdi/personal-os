import { Router } from 'express';
import { body } from 'express-validator';
import { upsertProgress, getProgress, getProgressStats } from '../controllers/progress.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate);

router.put('/', [
  body('questionId').notEmpty(),
  body('status').isIn(['todo', 'solving', 'done', 'revise']),
  body('confidence').optional({ nullable: true }).isInt({ min: 1, max: 5 }),
], validate, upsertProgress);

router.get('/', getProgress);
router.get('/stats', getProgressStats);

export default router;
