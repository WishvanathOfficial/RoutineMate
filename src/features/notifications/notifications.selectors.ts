import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

export const selectNotificationsStatus = (state: RootState) => state.notifications.status;

export const selectAllNotifications = (state: RootState) => state.notifications.items;

export const selectUnreadNotificationCount = createSelector(
  selectAllNotifications,
  (items) => items.filter((n) => !n.read).length,
);
