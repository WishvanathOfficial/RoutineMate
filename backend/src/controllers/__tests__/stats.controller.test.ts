jest.mock('../../services/stats.service');

import { Request } from 'express';
import * as statsService from '../../services/stats.service';
import * as statsController from '../stats.controller';
import { mockRes } from './testHelpers';

describe('stats.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getSummary returns the stats summary for the authenticated user', async () => {
    const summary = { totalCheckIns: 5 };
    (statsService.getStatsSummary as jest.Mock).mockResolvedValue(summary);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();

    await statsController.getSummary(req, res, jest.fn());

    expect(statsService.getStatsSummary).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: summary }));
  });

  it('forwards service errors to next instead of throwing', async () => {
    const error = new Error('boom');
    (statsService.getStatsSummary as jest.Mock).mockRejectedValue(error);
    const req = { user: { sub: 'u1' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    await statsController.getSummary(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
