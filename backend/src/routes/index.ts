import { Router } from 'express';
import authRoutes from './auth.routes';
import calendarRoutes from './calendar.routes';
import dashboardRoutes from './dashboard.routes';
import profileRoutes from './profile.routes';
import routinesRoutes from './routines.routes';
import statsRoutes from './stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/routines', routinesRoutes);
router.use('/calendar', calendarRoutes);
router.use('/stats', statsRoutes);
router.use('/profile', profileRoutes);

export default router;
