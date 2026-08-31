jest.mock('../../services/achievements.service');

import { Request } from 'express';
import * as achievementsService from '../../services/achievements.service';
import * as achievementsController from '../achievements.controller';
import { mockRes } from './testHelpers';

describe('achievements.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('list returns the achievements payload for the authenticated user', async () => {
    const payload = { items: [], xp: { totalPoints: 0, level: 1 } };
    (achievementsService.getAchievementsForUser as jest.Mock).mockResolvedValue(payload);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();

    await achievementsController.list(req, res, jest.fn());

    expect(achievementsService.getAchievementsForUser).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: payload }));
  });

  it('forwards service errors to next instead of throwing', async () => {
    const error = new Error('boom');
    (achievementsService.getAchievementsForUser as jest.Mock).mockRejectedValue(error);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    await achievementsController.list(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
