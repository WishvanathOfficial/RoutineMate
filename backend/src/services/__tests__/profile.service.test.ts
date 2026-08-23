jest.mock('../../models', () => ({
  User: { findByPk: jest.fn(), findOne: jest.fn() },
  UserPreferences: { findOrCreate: jest.fn() },
  RefreshToken: { update: jest.fn() },
  Routine: { destroy: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

import { RefreshToken, Routine, User, UserPreferences, sequelize } from '../../models';
import * as profileService from '../profile.service';

describe('profile.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation(async (cb: (t: unknown) => unknown) =>
      cb({}),
    );
  });

  describe('getProfile', () => {
    it('throws not found when the user does not exist', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(profileService.getProfile('missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('returns the user with preferences included', async () => {
      const user = { toJSON: () => ({ id: 'u1', preferences: { theme: 'dark' } }) };
      (User.findByPk as jest.Mock).mockResolvedValue(user);

      const result = await profileService.getProfile('u1');

      expect(result).toEqual({ id: 'u1', preferences: { theme: 'dark' } });
    });
  });

  describe('updateProfile', () => {
    it('throws not found for a missing user', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(profileService.updateProfile('u1', { name: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws conflict when the new email is already taken', async () => {
      const user = { email: 'old@x.com', set: jest.fn(), save: jest.fn() };
      (User.findByPk as jest.Mock).mockResolvedValue(user);
      (User.findOne as jest.Mock).mockResolvedValue({ id: 'other' });

      await expect(
        profileService.updateProfile('u1', { email: 'new@x.com' }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(user.set).not.toHaveBeenCalled();
    });

    it('updates and saves when the email is free', async () => {
      const user = {
        email: 'old@x.com',
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ email: 'new@x.com' }),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(user);
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await profileService.updateProfile('u1', { email: 'new@x.com' });

      expect(user.set).toHaveBeenCalledWith({ email: 'new@x.com' });
      expect(user.save).toHaveBeenCalled();
      expect(result).toEqual({ email: 'new@x.com' });
    });

    it('skips the uniqueness check when the email is unchanged', async () => {
      const user = {
        email: 'same@x.com',
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({}),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(user);

      await profileService.updateProfile('u1', { email: 'same@x.com' });

      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('finds or creates preferences, applies the update, and saves', async () => {
      const prefs = {
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ theme: 'dark' }),
      };
      (UserPreferences.findOrCreate as jest.Mock).mockResolvedValue([prefs, true]);

      const result = await profileService.updatePreferences('u1', { theme: 'dark' });

      expect(UserPreferences.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        defaults: { userId: 'u1' },
      });
      expect(prefs.set).toHaveBeenCalledWith({ theme: 'dark' });
      expect(prefs.save).toHaveBeenCalled();
      expect(result).toEqual({ theme: 'dark' });
    });
  });

  describe('deleteAccount', () => {
    it('throws not found for a missing user', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(profileService.deleteAccount('missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('soft-deletes routines, revokes refresh tokens, and soft-deletes the user', async () => {
      const user = { destroy: jest.fn().mockResolvedValue(undefined) };
      (User.findByPk as jest.Mock).mockResolvedValue(user);
      (Routine.destroy as jest.Mock).mockResolvedValue(2);
      (RefreshToken.update as jest.Mock).mockResolvedValue([1]);

      await profileService.deleteAccount('u1');

      expect(Routine.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
      expect(RefreshToken.update).toHaveBeenCalledWith(
        { revokedAt: expect.any(Date) },
        expect.objectContaining({ where: { userId: 'u1', revokedAt: null } }),
      );
      expect(user.destroy).toHaveBeenCalled();
    });
  });
});
