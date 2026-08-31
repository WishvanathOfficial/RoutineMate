import * as s from '../services/calendarSync.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const connections = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await s.connections(req.user!.sub)),
);
export const connectGoogle = asyncHandler(async (_req, res) =>
  ApiResponse.ok(res, { url: s.googleConnectUrl() }),
);
export const disconnect = asyncHandler(async (req, res) => {
  await s.disconnect(req.user!.sub, req.body.provider);
  ApiResponse.noContent(res);
});
export const sync = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await s.sync(req.user!.sub)),
);
export const conflicts = asyncHandler(async (_req, res) => ApiResponse.ok(res, []));
