import { Router } from 'express';
import authRoutes from './auth.routes';
import calendarRoutes from './calendar.routes';
import dashboardRoutes from './dashboard.routes';
import profileRoutes from './profile.routes';
import routinesRoutes from './routines.routes';
import statsRoutes from './stats.routes';
import goalsRoutes from './goals.routes';
import achievementsRoutes from './achievements.routes';
import journalRoutes from './journal.routes';
import notificationsRoutes from './notifications.routes';
import onboardingRoutes from './onboarding.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/routines', routinesRoutes);
router.use('/calendar', calendarRoutes);
router.use('/stats', statsRoutes);
router.use('/profile', profileRoutes);
router.use('/goals', goalsRoutes);
router.use('/achievements', achievementsRoutes);
router.use('/journal', journalRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;
