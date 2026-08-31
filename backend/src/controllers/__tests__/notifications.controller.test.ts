jest.mock('../../services/notifications.service');

import { Request } from 'express';
import * as notificationsService from '../../services/notifications.service';
import * as notificationsController from '../notifications.controller';
import { mockRes } from './testHelpers';

describe('notifications.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns notifications for the authenticated user', async () => {
      const items = [{ id: 'n1' }];
      (notificationsService.listNotifications as jest.Mock).mockResolvedValue(items);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await notificationsController.list(req, res, jest.fn());

      expect(notificationsService.listNotifications).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: items }));
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (notificationsService.listNotifications as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await notificationsController.list(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications read and returns the refreshed list', async () => {
      const items = [{ id: 'n1', read: true }];
      (notificationsService.markAllRead as jest.Mock).mockResolvedValue(items);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();

      await notificationsController.markAllRead(req, res, jest.fn());

      expect(notificationsService.markAllRead).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: items, message: 'All notifications marked as read' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (notificationsService.markAllRead as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await notificationsController.markAllRead(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('snooze', () => {
    it('snoozes the notification identified by params.id', async () => {
      const items = [{ id: 'n1' }];
      (notificationsService.snooze as jest.Mock).mockResolvedValue(items);
      const req = { user: { sub: 'u1' }, params: { id: 'n1' } } as unknown as Request;
      const res = mockRes();

      await notificationsController.snooze(req, res, jest.fn());

      expect(notificationsService.snooze).toHaveBeenCalledWith('u1', 'n1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: items, message: 'Snoozed for 30 minutes' }),
      );
    });

    it('forwards service errors to next instead of throwing', async () => {
      const error = new Error('boom');
      (notificationsService.snooze as jest.Mock).mockRejectedValue(error);
      const req = { user: { sub: 'u1' }, params: { id: 'n1' } } as unknown as Request;
      const res = mockRes();
      const next = jest.fn();

      await notificationsController.snooze(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
