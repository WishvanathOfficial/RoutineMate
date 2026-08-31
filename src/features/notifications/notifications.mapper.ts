// Translates the backend's raw `createdAt` timestamp into the relative
// label the UI shows ("2 minutes ago", "Yesterday", "In 30 minutes" for a
// just-snoozed reminder) — see backend/src/services/notifications.service.ts,
// whose module comment explains why `createdAt` doubles as the "fire time".
import type { AppNotification, NotificationType } from './notifications.types';

export interface BackendNotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  snoozeable: boolean;
  createdAt: string;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function toRelativeLabel(createdAt: string, now: Date = new Date()): string {
  const diffMs = new Date(createdAt).getTime() - now.getTime();

  // Snoozed reminders get bumped into the future by the backend — show a
  // countdown instead of a bogus "X ago".
  if (diffMs > 0) {
    if (diffMs < HOUR) return `In ${Math.max(1, Math.round(diffMs / MINUTE))} minutes`;
    return 'Later today';
  }

  const elapsed = -diffMs;
  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) {
    const minutes = Math.round(elapsed / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (elapsed < DAY) {
    const hours = Math.round(elapsed / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (elapsed < 2 * DAY) return 'Yesterday';
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fromBackendNotification(dto: BackendNotificationDto): AppNotification {
  return {
    id: dto.id,
    type: dto.type,
    message: dto.message,
    timeLabel: toRelativeLabel(dto.createdAt),
    read: dto.read,
    snoozeable: dto.snoozeable,
    createdAt: dto.createdAt,
  };
}
