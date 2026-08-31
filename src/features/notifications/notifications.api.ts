import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import { type BackendNotificationDto, fromBackendNotification } from './notifications.mapper';
import type { AppNotification } from './notifications.types';

// Real backend calls — see backend/src/services/notifications.service.ts.
// notifications.mapper.ts derives the display `timeLabel` from the
// backend's raw `createdAt`.

export async function fetchNotifications(): Promise<AppNotification[]> {
  const dtos = await httpClient.get('/api/notifications').then(unwrap<BackendNotificationDto[]>);
  return dtos.map(fromBackendNotification);
}

export async function markAllNotificationsRead(): Promise<AppNotification[]> {
  const dtos = await httpClient
    .patch('/api/notifications/mark-all-read')
    .then(unwrap<BackendNotificationDto[]>);
  return dtos.map(fromBackendNotification);
}

export async function snoozeNotification(id: string): Promise<AppNotification[]> {
  const dtos = await httpClient
    .patch(`/api/notifications/${id}/snooze`)
    .then(unwrap<BackendNotificationDto[]>);
  return dtos.map(fromBackendNotification);
}
