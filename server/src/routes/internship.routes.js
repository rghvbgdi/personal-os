import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upsertInternship, getInternship } from '../controllers/internship.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', upsertInternship);
router.get('/',  getInternship);

export default router;
