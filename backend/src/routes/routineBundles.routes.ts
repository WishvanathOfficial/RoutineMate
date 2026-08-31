import { Router } from 'express';
import * as c from '../controllers/routineBundles.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  bundleCheckInSchema,
  bundleIdSchema,
  bundleListSchema,
  createBundleSchema,
  updateBundleSchema,
} from '../validators/routineBundles.validator';
const router = Router();
router.use(requireAuth);
router.get('/', validate(bundleListSchema), c.list);
router.post('/', validate(createBundleSchema), c.create);
router.get('/:id', validate(bundleIdSchema), c.get);
router.patch('/:id', validate(updateBundleSchema), c.update);
router.delete('/:id', validate(bundleIdSchema), c.remove);
router.post('/:id/check-ins', validate(bundleCheckInSchema), c.checkIn);
export default router;
