import reducer from '../notifications.slice';
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  snoozeNotificationThunk,
} from '../notifications.thunks';
import type { AppNotification, NotificationsState } from '../notifications.types';

const sampleNotification: AppNotification = {
  id: 'notif-1',
  type: 'reminder',
  message: 'Time to drink water!',
  timeLabel: '8:00 AM',
  read: false,
  createdAt: '2026-08-24T08:00:00.000Z',
  snoozeable: true,
};

const initialState: NotificationsState = { items: [], status: 'idle', error: null };

describe('notifications.slice', () => {
  it('sets loading status while fetching notifications', () => {
    const action = { type: fetchNotificationsThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('stores notifications on fetch fulfilled', () => {
    const action = { type: fetchNotificationsThunk.fulfilled.type, payload: [sampleNotification] };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.items).toHaveLength(1);
  });

  it('marks all notifications as read on markAllRead fulfilled', () => {
    const seeded: NotificationsState = { ...initialState, items: [sampleNotification] };
    const readNotifications: AppNotification[] = [{ ...sampleNotification, read: true }];
    const action = {
      type: markAllNotificationsReadThunk.fulfilled.type,
      payload: readNotifications,
    };
    const state = reducer(seeded, action);
    expect(state.items[0].read).toBe(true);
  });

  it('replaces items with the snoozed list on snooze fulfilled', () => {
    const seeded: NotificationsState = { ...initialState, items: [sampleNotification] };
    const snoozed: AppNotification[] = [{ ...sampleNotification, timeLabel: '8:30 AM' }];
    const action = { type: snoozeNotificationThunk.fulfilled.type, payload: snoozed };
    const state = reducer(seeded, action);
    expect(state.items[0].timeLabel).toBe('8:30 AM');
  });

  it('stores the extracted error message when fetch is rejected', () => {
    const action = { type: fetchNotificationsThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when fetch is rejected without a payload', () => {
    const action = { type: fetchNotificationsThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load notifications.');
  });
});
