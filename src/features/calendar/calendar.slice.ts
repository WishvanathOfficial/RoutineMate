import { createSlice } from '@reduxjs/toolkit';
import type { CalendarState } from './calendar.types';
import { fetchCalendarThunk } from './calendar.thunks';

const initialState: CalendarState = {
  month: null,
  status: 'idle',
  error: null,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCalendarThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.month = action.payload;
        state.error = null;
      })
      .addCase(fetchCalendarThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load calendar.';
      });
  },
});

export default calendarSlice.reducer;
