jest.mock('../../services/auth.service');
jest.mock('../../config/env', () => ({ env: { isProduction: false } }));

import { Request } from 'express';
import * as authService from '../../services/auth.service';
import * as authController from '../auth.controller';
import { ApiError } from '../../utils/ApiError';
import { mockRes } from './testHelpers';

describe('auth.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('sets the refresh cookie and returns 201 with the access token', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        user: { id: 'u1' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenExpiresAt: new Date('2030-01-01'),
      });
      const req = { body: { name: 'A', email: 'a@a.com', password: 'pw123456' } } as Request;
      const res = mockRes();
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true, path: '/api/auth' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { user: { id: 'u1' }, accessToken: 'access-token' },
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = ApiError.conflict('Email taken');
      (authService.register as jest.Mock).mockRejectedValue(error);
      const req = { body: {} } as Request;
      const res = mockRes();
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('sets the refresh cookie and returns 200 with the access token', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        user: { id: 'u1' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenExpiresAt: new Date('2030-01-01'),
      });
      const req = { body: { email: 'a@a.com', password: 'pw' } } as Request;
      const res = mockRes();

      await authController.login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rejects with unauthorized when no refresh cookie is present', async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('rotates the cookie and returns a new access token', async () => {
      (authService.refresh as jest.Mock).mockResolvedValue({
        user: { id: 'u1' },
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        refreshTokenExpiresAt: new Date('2030-01-01'),
      });
      const req = { cookies: { refreshToken: 'old-refresh' } } as unknown as Request;
      const res = mockRes();

      await authController.refresh(req, res, jest.fn());

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh', expect.anything());
    });
  });

  describe('logout', () => {
    it('clears the cookie and returns 200', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);
      const req = { cookies: {} } as unknown as Request;
      const res = mockRes();

      await authController.logout(req, res, jest.fn());

      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ path: '/api/auth' }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
