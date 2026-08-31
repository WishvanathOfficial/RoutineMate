import { createSlice } from '@reduxjs/toolkit';
import type { AchievementsState } from './achievements.types';
import { fetchAchievementsThunk } from './achievements.thunks';

const initialState: AchievementsState = {
  items: [],
  xp: null,
  status: 'idle',
  error: null,
};

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievementsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAchievementsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.xp = action.payload.xp;
      })
      .addCase(fetchAchievementsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load achievements.';
      });
  },
});

export default achievementsSlice.reducer;
