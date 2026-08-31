import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { notificationIdParamSchema } from '../validators/notifications.validator';

const router = Router();
router.use(requireAuth);

router.get('/', notificationsController.list);
router.patch('/mark-all-read', notificationsController.markAllRead);
router.patch('/:id/snooze', validate(notificationIdParamSchema), notificationsController.snooze);

export default router;
