import { Router } from 'express';
import * as controller from '../controllers/leaderboards.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { leaderboardQuerySchema } from '../validators/leaderboards.validator';
const router = Router();
router.use(requireAuth);
router.get('/', validate(leaderboardQuerySchema), controller.friends);
export default router;
