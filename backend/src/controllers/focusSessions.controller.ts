import * as s from '../services/focusSessions.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const start = asyncHandler(async (req, res) =>
  ApiResponse.created(
    res,
    await s.start(req.user!.sub, req.body.routineId),
    'Focus session started',
  ),
);
export const update = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await s.update(req.user!.sub, req.params.id, req.body),
    'Focus session updated',
  ),
);
export const complete = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await s.complete(req.user!.sub, req.params.id, req.body.durationSeconds),
    'Focus session completed',
  ),
);
export const summary = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await s.summary(req.user!.sub)),
);
