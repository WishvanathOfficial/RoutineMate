import { Router } from 'express';
import * as c from '../controllers/billing.controller';
import { requireAuth } from '../middleware/auth.middleware';
const r = Router();
r.get('/subscription', requireAuth, c.subscription);
r.post('/checkout', requireAuth, c.checkout);
r.post('/portal', requireAuth, c.portal);
r.post('/webhook', c.webhook);
export default r;
