import { createSlice } from '@reduxjs/toolkit';
import type { DashboardState } from './dashboard.types';
import { fetchGreetingThunk } from './dashboard.thunks';

const initialState: DashboardState = {
  greeting: null,
  status: 'idle',
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGreetingThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGreetingThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.greeting = action.payload;
      })
      .addCase(fetchGreetingThunk.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default dashboardSlice.reducer;
