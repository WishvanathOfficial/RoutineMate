import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import * as s from '../services/feedback.service';
import { validate } from '../middleware/validate.middleware';
import {
  createFeedbackSchema,
  feedbackIdSchema,
  listFeedbackSchema,
  setFeedbackStatusSchema,
} from '../validators/feedback.validator';
const r = Router();
r.get(
  '/roadmap',
  asyncHandler(async (_q, res) => ApiResponse.ok(res, await s.list())),
);
r.use(requireAuth);
r.get(
  '/feedback',
  validate(listFeedbackSchema),
  asyncHandler(async (req, res) =>
    ApiResponse.ok(
      res,
      await s.list(
        req.query.status as 'planned' | 'in-progress' | 'shipped' | undefined,
        req.user!.sub,
      ),
    ),
  ),
);
r.post(
  '/feedback',
  validate(createFeedbackSchema),
  asyncHandler(async (req, res) =>
    ApiResponse.created(res, await s.create(req.user!.sub, req.body.title, req.body.description)),
  ),
);
r.post(
  '/feedback/:id/votes',
  validate(feedbackIdSchema),
  asyncHandler(async (req, res) => ApiResponse.ok(res, await s.vote(req.user!.sub, req.params.id))),
);
r.delete(
  '/feedback/:id/votes',
  validate(feedbackIdSchema),
  asyncHandler(async (req, res) =>
    ApiResponse.ok(res, await s.unvote(req.user!.sub, req.params.id)),
  ),
);
r.patch(
  '/feedback/:id/status',
  validate(setFeedbackStatusSchema),
  asyncHandler(async (req, res) =>
    ApiResponse.ok(res, await s.setStatus(req.user!.sub, req.params.id, req.body.status)),
  ),
);
export default r;
