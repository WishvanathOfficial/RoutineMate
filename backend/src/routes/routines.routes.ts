import { Router } from 'express';
import * as routinesController from '../controllers/routines.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  checkInSchema,
  createRoutineSchema,
  listRoutinesQuerySchema,
  routineIdParamSchema,
  updateRoutineSchema,
} from '../validators/routines.validator';

const router = Router();
router.use(requireAuth);

router.get('/', validate(listRoutinesQuerySchema), routinesController.list);
router.post('/', validate(createRoutineSchema), routinesController.create);
router.get('/:id', validate(routineIdParamSchema), routinesController.getOne);
router.put('/:id', validate(updateRoutineSchema), routinesController.update);
router.delete('/:id', validate(routineIdParamSchema), routinesController.remove);
router.patch('/:id/pause', validate(routineIdParamSchema), routinesController.pause);
router.post('/:id/check-in', validate(checkInSchema), routinesController.checkIn);

export default router;
