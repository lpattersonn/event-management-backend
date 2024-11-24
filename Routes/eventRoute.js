import express from 'express';

import {
  createEvent,
  getEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from '../Controllers/eventControllers.js';

const router = express.Router();

router.get('/', getEvents);
router.post('/new', createEvent);
router.get('/event/:id', getEvent);
router.put('/update/:id', updateEvent);
router.delete('/delete/:id', deleteEvent);

export default router;