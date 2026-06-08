import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upsertReview, getReview } from '../controllers/review.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', upsertReview);
router.get('/',  getReview);

export default router;
