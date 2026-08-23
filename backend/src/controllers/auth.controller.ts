import { Response } from 'express';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const REFRESH_COOKIE_NAME = 'refreshToken';

function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.register(
    req.body,
  );
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  ApiResponse.created(res, { user, accessToken }, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.login(
    req.body,
  );
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  ApiResponse.ok(res, { user, accessToken }, 'Logged in');
});

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!raw) throw ApiError.unauthorized('Missing refresh token');

  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = await authService.refresh(raw);
  setRefreshCookie(res, refreshToken, refreshTokenExpiresAt);
  ApiResponse.ok(res, { user, accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(raw);
  clearRefreshCookie(res);
  ApiResponse.ok(res, null, 'Logged out');
});
