import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updatePreferencesSchema, updateProfileSchema } from '../validators/profile.validator';

const router = Router();
router.use(requireAuth);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.put('/preferences', validate(updatePreferencesSchema), profileController.updatePreferences);
router.delete('/', profileController.deleteAccount);

export default router;
