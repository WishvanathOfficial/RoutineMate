import { Router } from 'express';
import * as controller from '../controllers/friends.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  friendActionSchema,
  friendIdSchema,
  friendRequestSchema,
  publicProfileSchema,
  userSearchSchema,
} from '../validators/friends.validator';
const router = Router();
router.use(requireAuth);
router.get('/', controller.list);
router.post('/requests', validate(friendRequestSchema), controller.request);
router.patch('/requests/:id', validate(friendActionSchema), controller.action);
router.delete('/:id', validate(friendIdSchema), controller.remove);
router.get('/search', validate(userSearchSchema), controller.search);
router.get('/users/:id/public-profile', validate(publicProfileSchema), controller.profile);
export default router;
