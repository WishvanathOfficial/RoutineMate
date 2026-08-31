jest.mock('../../models', () => ({
  Notification: {
    findAll: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  },
}));

import { Notification } from '../../models';
import * as notificationsService from '../notifications.service';

describe('notifications.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('listNotifications', () => {
    it('returns notifications for the user mapped to DTOs', async () => {
      (Notification.findAll as jest.Mock).mockResolvedValue([
        {
          id: 'n1',
          type: 'reminder',
          message: 'Time for "Read" 📖!',
          read: false,
          snoozeable: true,
          createdAt: new Date('2026-08-20T09:00:00Z'),
        },
      ]);

      const result = await notificationsService.listNotifications('u1');

      expect(Notification.findAll).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
      expect(result).toEqual([
        {
          id: 'n1',
          type: 'reminder',
          message: 'Time for "Read" 📖!',
          read: false,
          snoozeable: true,
          createdAt: '2026-08-20T09:00:00.000Z',
        },
      ]);
    });

    it('returns an empty array when the user has no notifications', async () => {
      (Notification.findAll as jest.Mock).mockResolvedValue([]);

      const result = await notificationsService.listNotifications('u1');

      expect(result).toEqual([]);
    });
  });

  describe('markAllRead', () => {
    it('marks all unread notifications as read and returns the refreshed list', async () => {
      (Notification.update as jest.Mock).mockResolvedValue([1]);
      (Notification.findAll as jest.Mock).mockResolvedValue([]);

      const result = await notificationsService.markAllRead('u1');

      expect(Notification.update).toHaveBeenCalledWith(
        { read: true },
        { where: { userId: 'u1', read: false } },
      );
      expect(Notification.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('snooze', () => {
    it('throws not found when the notification does not exist for the user', async () => {
      (Notification.findOne as jest.Mock).mockResolvedValue(null);

      await expect(notificationsService.snooze('u1', 'missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws bad request when the notification is not snoozeable', async () => {
      (Notification.findOne as jest.Mock).mockResolvedValue({
        id: 'n1',
        snoozeable: false,
      });

      await expect(notificationsService.snooze('u1', 'n1')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('pushes createdAt forward by 30 minutes, clears read, saves, and returns the refreshed list', async () => {
      const notification = {
        id: 'n1',
        snoozeable: true,
        read: true,
        createdAt: new Date('2026-08-20T09:00:00Z'),
        save: jest.fn().mockResolvedValue(undefined),
      };
      (Notification.findOne as jest.Mock).mockResolvedValue(notification);
      (Notification.findAll as jest.Mock).mockResolvedValue([]);

      const result = await notificationsService.snooze('u1', 'n1');

      expect(notification.read).toBe(false);
      expect(notification.createdAt).toEqual(new Date('2026-08-20T12:30:00Z'));
      expect(notification.save).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
