jest.mock('../../services/calendarSync.service');

import { Request } from 'express';
import * as calendarSyncService from '../../services/calendarSync.service';
import * as calendarSyncController from '../calendarSync.controller';
import { mockRes } from './testHelpers';

describe('calendarSync.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('awaits and returns the signed Google authorization URL', async () => {
    (calendarSyncService.googleConnectUrl as jest.Mock).mockResolvedValue(
      'https://accounts.google.com/oauth',
    );
    const req = {
      user: { sub: 'user-1' },
      query: { timeZone: 'Europe/Paris' },
    } as unknown as Request;
    const res = mockRes();

    await calendarSyncController.connectGoogle(req, res, jest.fn());

    expect(calendarSyncService.googleConnectUrl).toHaveBeenCalledWith('user-1', 'Europe/Paris');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { url: 'https://accounts.google.com/oauth' },
      }),
    );
  });
});
