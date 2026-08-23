jest.mock('../../services/profile.service');

import { Request } from 'express';
import * as profileService from '../../services/profile.service';
import * as profileController from '../profile.controller';
import { mockRes } from './testHelpers';

describe('profile.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getProfile returns the profile for the authenticated user', async () => {
    (profileService.getProfile as jest.Mock).mockResolvedValue({ id: 'u1' });
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();

    await profileController.getProfile(req, res, jest.fn());

    expect(profileService.getProfile).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'u1' } }));
  });

  it('updateProfile forwards the body to the service', async () => {
    (profileService.updateProfile as jest.Mock).mockResolvedValue({ id: 'u1', name: 'New' });
    const req = { user: { sub: 'u1' }, body: { name: 'New' } } as unknown as Request;
    const res = mockRes();

    await profileController.updateProfile(req, res, jest.fn());

    expect(profileService.updateProfile).toHaveBeenCalledWith('u1', { name: 'New' });
  });

  it('updatePreferences forwards the body to the service', async () => {
    (profileService.updatePreferences as jest.Mock).mockResolvedValue({ theme: 'dark' });
    const req = { user: { sub: 'u1' }, body: { theme: 'dark' } } as unknown as Request;
    const res = mockRes();

    await profileController.updatePreferences(req, res, jest.fn());

    expect(profileService.updatePreferences).toHaveBeenCalledWith('u1', { theme: 'dark' });
  });

  it('deleteAccount returns 204 with no body', async () => {
    (profileService.deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();

    await profileController.deleteAccount(req, res, jest.fn());

    expect(profileService.deleteAccount).toHaveBeenCalledWith('u1');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('forwards service errors to next instead of throwing', async () => {
    const error = new Error('boom');
    (profileService.getProfile as jest.Mock).mockRejectedValue(error);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    await profileController.getProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
