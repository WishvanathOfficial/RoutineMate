import { Router } from 'express';
import * as achievementsController from '../controllers/achievements.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', achievementsController.list);

export default router;
