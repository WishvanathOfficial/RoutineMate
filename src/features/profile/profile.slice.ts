import { createSlice } from '@reduxjs/toolkit';
import type { ProfileState } from './profile.types';
import { fetchProfileThunk, updateAccountThunk, updatePreferencesThunk } from './profile.thunks';

const initialState: ProfileState = {
  preferences: {
    pushRemindersEnabled: true,
    dailyDigestEnabled: false,
  },
  status: 'idle',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preferences = action.payload.preferences;
      })
      .addCase(fetchProfileThunk.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updateAccountThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateAccountThunk.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updatePreferencesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preferences = action.payload;
      });
  },
});

export default profileSlice.reducer;
