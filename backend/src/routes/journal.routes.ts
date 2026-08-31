import { Router } from 'express';
import * as journalController from '../controllers/journal.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  getEntryByDateSchema,
  saveEntryForDateSchema,
  saveJournalEntrySchema,
} from '../validators/journal.validator';

const router = Router();
router.use(requireAuth);

router.get('/', journalController.list);
router.post('/', validate(saveJournalEntrySchema), journalController.save);
router.get('/:date', validate(getEntryByDateSchema), journalController.getByDate);
router.put('/:date', validate(saveEntryForDateSchema), journalController.saveForDate);

export default router;
