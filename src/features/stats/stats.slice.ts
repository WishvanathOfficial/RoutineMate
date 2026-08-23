import { createSlice } from '@reduxjs/toolkit';
import type { StatsState } from './stats.types';
import { fetchStatsThunk } from './stats.thunks';

const initialState: StatsState = {
  summary: null,
  status: 'idle',
  error: null,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStatsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchStatsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load stats.';
      });
  },
});

export default statsSlice.reducer;
