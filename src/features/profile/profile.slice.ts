import { createSlice } from '@reduxjs/toolkit';
import type { ProfileState } from './profile.types';
import { fetchProfileThunk, updateAccountThunk, updatePreferencesThunk } from './profile.thunks';

const initialState: ProfileState = {
  preferences: {
    pushRemindersEnabled: true,
    dailyDigestEnabled: false,
    weeklyEmailEnabled: false,
    language: 'en',
    units: 'metric',
  },
  status: 'idle',
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preferences = action.payload.preferences;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load profile.';
      })
      .addCase(updateAccountThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateAccountThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateAccountThunk.rejected, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(updatePreferencesThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePreferencesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(updatePreferencesThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to save preferences.';
      });
  },
});

export default profileSlice.reducer;
