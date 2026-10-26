import * as s from '../services/calendarSync.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
export const connections = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await s.connections(req.user!.sub)),
);
export const connectGoogle = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, {
    url: await s.googleConnectUrl(
      req.user!.sub,
      typeof req.query.timeZone === 'string' ? req.query.timeZone : 'UTC',
    ),
  }),
);
export const disconnect = asyncHandler(async (req, res) => {
  await s.disconnect(req.user!.sub, req.body.provider);
  ApiResponse.noContent(res);
});
export const sync = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await s.sync(req.user!.sub)),
);
export const conflicts = asyncHandler(async (_req, res) => ApiResponse.ok(res, []));

export async function googleOAuthCallback(
  req: import('express').Request,
  res: import('express').Response,
) {
  const redirect = new URL('/calendar', env.corsOrigin);
  try {
    if (typeof req.query.error === 'string') {
      throw ApiError.badRequest('Google authorization was declined.');
    }
    if (typeof req.query.code !== 'string' || typeof req.query.state !== 'string') {
      throw ApiError.badRequest('Google authorization response is incomplete.');
    }
    await s.completeGoogleOAuth(req.query.code, req.query.state);
    redirect.searchParams.set('calendar', 'connected');
  } catch (error) {
    logger.error('Google Calendar OAuth callback failed:', error);
    redirect.searchParams.set('calendar', 'error');
  }
  res.redirect(redirect.toString());
}
