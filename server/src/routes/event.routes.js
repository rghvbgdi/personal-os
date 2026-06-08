import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js';

const router = Router();
router.use(authenticate);

router.post('/',     createEvent);
router.get('/',      getEvents);
router.get('/:id',   getEvent);
router.patch('/:id', updateEvent);
router.delete('/:id',deleteEvent);

export default router;
