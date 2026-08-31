import { createSlice } from '@reduxjs/toolkit';
import type { NotificationsState } from './notifications.types';
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  snoozeNotificationThunk,
} from './notifications.thunks';

const initialState: NotificationsState = {
  items: [],
  status: 'idle',
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load notifications.';
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(snoozeNotificationThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export default notificationsSlice.reducer;
