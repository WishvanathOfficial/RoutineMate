import { Router } from 'express';
import * as calendarController from '../controllers/calendar.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { calendarQuerySchema } from '../validators/calendar.validator';

const router = Router();
router.use(requireAuth);

router.get('/', validate(calendarQuerySchema), calendarController.getMonth);

export default router;
