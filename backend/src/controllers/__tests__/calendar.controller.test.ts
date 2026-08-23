jest.mock('../../services/calendar.service');

import { Request } from 'express';
import * as calendarService from '../../services/calendar.service';
import * as calendarController from '../calendar.controller';
import { mockRes } from './testHelpers';

describe('calendar.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getMonth passes the month query param and user id to the service', async () => {
    (calendarService.getMonthCalendar as jest.Mock).mockResolvedValue({
      month: '2026-08',
      days: [],
    });
    const req = { user: { sub: 'u1' }, query: { month: '2026-08' } } as unknown as Request;
    const res = mockRes();

    await calendarController.getMonth(req, res, jest.fn());

    expect(calendarService.getMonthCalendar).toHaveBeenCalledWith('u1', '2026-08');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: { month: '2026-08', days: [] } }),
    );
  });

  it('forwards service errors to next instead of throwing', async () => {
    const error = new Error('boom');
    (calendarService.getMonthCalendar as jest.Mock).mockRejectedValue(error);
    const req = { user: { sub: 'u1' }, query: { month: '2026-08' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn();

    await calendarController.getMonth(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
