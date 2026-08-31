import { Notification } from '../models';
import { Notification as NotificationModel } from '../models/notification.model';
import { ApiError } from '../utils/ApiError';

// docs/RoutineMate-MVP2-Scope.md §3.5/§5 "Notification". `createdAt` doubles
// as the notification's "fire time" — the frontend derives a relative label
// ("2 minutes ago", "in 30 minutes") from it, and snoozing simply pushes it
// forward rather than adding a separate scheduling field.

const SNOOZE_MS = 30 * 60 * 1000;
const MAX_RESULTS = 30;

function toDto(notification: NotificationModel) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    snoozeable: notification.snoozeable,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function listNotifications(userId: string) {
  const items = await Notification.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: MAX_RESULTS,
  });
  return items.map(toDto);
}

export async function markAllRead(userId: string) {
  await Notification.update({ read: true }, { where: { userId, read: false } });
  return listNotifications(userId);
}

export async function snooze(userId: string, notificationId: string) {
  const notification = await Notification.findOne({ where: { id: notificationId, userId } });
  if (!notification) throw ApiError.notFound('Notification not found');
  if (!notification.snoozeable) {
    throw ApiError.badRequest('This notification cannot be snoozed');
  }
  notification.createdAt = new Date(Date.now() + SNOOZE_MS);
  notification.read = false;
  await notification.save();
  return listNotifications(userId);
}
