import { Router } from 'express';
import * as goalsController from '../controllers/goals.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createGoalSchema,
  listGoalsSchema,
  toggleMilestoneSchema,
  goalIdSchema,
} from '../validators/goals.validator';

const router = Router();
router.use(requireAuth);

router.get('/', validate(listGoalsSchema), goalsController.list);
router.post('/', validate(createGoalSchema), goalsController.create);
router.delete('/:id', validate(goalIdSchema), goalsController.remove);
router.patch(
  '/:id/milestones/:milestoneId',
  validate(toggleMilestoneSchema),
  goalsController.toggleMilestone,
);

export default router;
