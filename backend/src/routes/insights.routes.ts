import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as s from '../services/insights.service';
const r = Router();
r.use(requireAuth);
r.get(
  '/',
  asyncHandler(async (req, res) => ApiResponse.ok(res, await s.get(req.user!.sub))),
);
r.post(
  '/:id/feedback',
  asyncHandler(async (req, res) =>
    ApiResponse.ok(
      res,
      await s.feedback(req.user!.sub, req.params.id, req.body.feedback),
      'Feedback saved',
    ),
  ),
);
export default r;
