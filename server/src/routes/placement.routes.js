import { Router } from 'express';
import { createTopic, getTopics, updateTopic, deleteTopic, getPlacementStats, markRevision } from '../controllers/placement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';
import { SUBJECTS, DIFFICULTIES, MASTERY_LEVELS } from '../models/PlacementTopic.js';

const router = Router();
router.use(authenticate);

router.post('/', [
  body('subject').isIn(SUBJECTS),
  body('title').trim().notEmpty().isLength({ max: 100 }),
  body('difficulty').optional().isIn(DIFFICULTIES),
], validate, createTopic);
router.get('/', getTopics);
router.get('/stats', getPlacementStats);
router.patch('/:id', updateTopic);
router.patch('/:id/revise', markRevision);
router.delete('/:id', deleteTopic);

export default router;
