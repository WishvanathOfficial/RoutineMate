import * as notificationsService from '../services/notifications.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const items = await notificationsService.listNotifications(req.user!.sub);
  ApiResponse.ok(res, items);
});

export const markAllRead = asyncHandler(async (req, res) => {
  const items = await notificationsService.markAllRead(req.user!.sub);
  ApiResponse.ok(res, items, 'All notifications marked as read');
});

export const snooze = asyncHandler(async (req, res) => {
  const items = await notificationsService.snooze(req.user!.sub, req.params.id);
  ApiResponse.ok(res, items, 'Snoozed for 30 minutes');
});
