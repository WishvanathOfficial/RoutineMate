import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/greeting', dashboardController.getGreeting);
router.get('/overview', dashboardController.getOverview);

export default router;
