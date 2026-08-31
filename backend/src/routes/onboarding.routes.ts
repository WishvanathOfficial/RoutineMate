import { Router } from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { completeOnboardingSchema } from '../validators/onboarding.validator';

const router = Router();
router.use(requireAuth);

router.get('/', onboardingController.getState);
router.post('/complete', validate(completeOnboardingSchema), onboardingController.complete);

export default router;
