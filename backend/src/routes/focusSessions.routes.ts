import { Router } from 'express';
import * as c from '../controllers/focusSessions.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createFocusSchema,
  focusIdSchema,
  updateFocusSchema,
} from '../validators/focusSessions.validator';
const r = Router();
r.use(requireAuth);
r.post('/', validate(createFocusSchema), c.start);
r.get('/summary', c.summary);
r.patch('/:id', validate(updateFocusSchema), c.update);
r.post('/:id/complete', validate(focusIdSchema), c.complete);
export default r;
