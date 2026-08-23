import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/summary', statsController.getSummary);

export default router;
