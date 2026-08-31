import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import {
  fetchNotifications,
  markAllNotificationsRead,
  snoozeNotification,
} from './notifications.api';
import type { AppNotification } from './notifications.types';

export const fetchNotificationsThunk = createAsyncThunk<
  AppNotification[],
  void,
  { rejectValue: string }
>('notifications/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchNotifications();
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load notifications.'));
  }
});

export const markAllNotificationsReadThunk = createAsyncThunk<
  AppNotification[],
  void,
  { rejectValue: string }
>('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    return await markAllNotificationsRead();
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to update notifications.'));
  }
});

export const snoozeNotificationThunk = createAsyncThunk<
  AppNotification[],
  string,
  { rejectValue: string }
>('notifications/snooze', async (id, { rejectWithValue }) => {
  try {
    return await snoozeNotification(id);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to snooze reminder.'));
  }
});
