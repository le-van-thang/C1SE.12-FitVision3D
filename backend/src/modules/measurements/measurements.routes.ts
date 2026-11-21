import { Router } from 'express';
import { measurementsController } from './measurements.controller.js';
import { requireAuth } from '../../middlewares/authGuard.js';

export const measurementsRouter = Router();

// All body measurement persistence endpoints require an authenticated JWT user
// Zero-Retention policy: raw body photos are NEVER accepted or persisted here.
measurementsRouter.get('/latest', requireAuth, measurementsController.getLatest);
measurementsRouter.get('/history', requireAuth, measurementsController.getHistory);
measurementsRouter.post('/', requireAuth, measurementsController.saveSnapshot);
measurementsRouter.delete('/:id', requireAuth, measurementsController.remove);
