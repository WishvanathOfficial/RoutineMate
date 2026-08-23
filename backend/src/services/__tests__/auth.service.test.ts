jest.mock('../../models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), unscoped: jest.fn() },
  UserPreferences: { create: jest.fn() },
  RefreshToken: { create: jest.fn(), findOne: jest.fn(), update: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));
jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));
jest.mock('../../utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  expiresInToDate: jest.fn(),
}));
jest.mock('../../utils/hash', () => ({
  sha256: jest.fn(),
}));

import { RefreshToken, User, UserPreferences, sequelize } from '../../models';
import { sha256 } from '../../utils/hash';
import {
  expiresInToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { comparePassword, hashPassword } from '../../utils/password';
import * as authService from '../auth.service';

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation(async (cb: (t: unknown) => unknown) =>
      cb({}),
    );
  });

  describe('register', () => {
    it('throws a conflict error when the email is already registered', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({ name: 'A', email: 'a@a.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(User.create).not.toHaveBeenCalled();
    });

    it('creates a user + default preferences and returns a token pair', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed-pw');
      const fakeUser = { id: 'user-1', name: 'A', email: 'a@a.com', avatarUrl: null };
      (User.create as jest.Mock).mockResolvedValue(fakeUser);
      (UserPreferences.create as jest.Mock).mockResolvedValue({});
      (signRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (signAccessToken as jest.Mock).mockReturnValue('access-token');
      (expiresInToDate as jest.Mock).mockReturnValue(new Date('2030-01-01'));
      (sha256 as jest.Mock).mockReturnValue('hashed-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register({
        name: 'A',
        email: 'a@a.com',
        password: 'password123',
      });

      expect(User.create).toHaveBeenCalledWith(
        { name: 'A', email: 'a@a.com', passwordHash: 'hashed-pw' },
        expect.objectContaining({ transaction: expect.anything() }),
      );
      expect(UserPreferences.create).toHaveBeenCalledWith(
        { userId: 'user-1' },
        expect.objectContaining({ transaction: expect.anything() }),
      );
      expect(RefreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', tokenHash: 'hashed-token' }),
      );
      expect(result).toEqual({
        user: { id: 'user-1', name: 'A', email: 'a@a.com', avatarUrl: null },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshTokenExpiresAt: new Date('2030-01-01'),
      });
    });
  });

  describe('login', () => {
    it('throws unauthorized when no user matches the email', async () => {
      (User.unscoped as jest.Mock).mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) });

      await expect(authService.login({ email: 'x@x.com', password: 'pw' })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('throws unauthorized when the password does not match', async () => {
      const fakeUser = { id: 'u1', passwordHash: 'hash' };
      (User.unscoped as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(fakeUser),
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'x@x.com', password: 'wrong' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns the user and a token pair on success', async () => {
      const fakeUser = {
        id: 'u1',
        name: 'A',
        email: 'x@x.com',
        avatarUrl: null,
        passwordHash: 'hash',
      };
      (User.unscoped as jest.Mock).mockReturnValue({
        findOne: jest.fn().mockResolvedValue(fakeUser),
      });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (signAccessToken as jest.Mock).mockReturnValue('access-token');
      (signRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      (expiresInToDate as jest.Mock).mockReturnValue(new Date('2030-01-01'));
      (sha256 as jest.Mock).mockReturnValue('hash-token');
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login({ email: 'x@x.com', password: 'right' });

      expect(result.user).toEqual({ id: 'u1', name: 'A', email: 'x@x.com', avatarUrl: null });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });
  });

  describe('refresh', () => {
    it('throws unauthorized for a token that fails signature/expiry verification', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('bad token');
      });

      await expect(authService.refresh('bad-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws unauthorized when the stored token is revoked', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tokenId: 't1' });
      (sha256 as jest.Mock).mockReturnValue('hash');
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
      });

      await expect(authService.refresh('token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws unauthorized when the stored token has expired', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tokenId: 't1' });
      (sha256 as jest.Mock).mockReturnValue('hash');
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10_000),
      });

      await expect(authService.refresh('token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws unauthorized when the user no longer exists', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tokenId: 't1' });
      (sha256 as jest.Mock).mockReturnValue('hash');
      (RefreshToken.findOne as jest.Mock).mockResolvedValue({
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10_000),
      });
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(authService.refresh('token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('revokes the presented token and issues a fresh pair', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', tokenId: 't1' });
      (sha256 as jest.Mock).mockReturnValue('hash');
      const existingToken = {
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10_000),
        save: jest.fn().mockResolvedValue(undefined),
      };
      (RefreshToken.findOne as jest.Mock).mockResolvedValue(existingToken);
      (User.findByPk as jest.Mock).mockResolvedValue({
        id: 'u1',
        name: 'A',
        email: 'a@a.com',
        avatarUrl: null,
      });
      (signAccessToken as jest.Mock).mockReturnValue('access-token-2');
      (signRefreshToken as jest.Mock).mockReturnValue('refresh-token-2');
      (expiresInToDate as jest.Mock).mockReturnValue(new Date('2030-01-01'));
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.refresh('token');

      expect(existingToken.revokedAt).toBeInstanceOf(Date);
      expect(existingToken.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('access-token-2');
      expect(result.refreshToken).toBe('refresh-token-2');
    });
  });

  describe('logout', () => {
    it('does nothing when no token is provided', async () => {
      await authService.logout(undefined);
      expect(RefreshToken.update).not.toHaveBeenCalled();
    });

    it('revokes the token matching the presented hash', async () => {
      (sha256 as jest.Mock).mockReturnValue('hash');
      (RefreshToken.update as jest.Mock).mockResolvedValue([1]);

      await authService.logout('raw-token');

      expect(RefreshToken.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        expect.objectContaining({ where: expect.objectContaining({ tokenHash: 'hash' }) }),
      );
    });
  });
});
