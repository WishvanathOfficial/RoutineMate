import { createSlice } from '@reduxjs/toolkit';
import type { CalendarState } from './calendar.types';
import { fetchCalendarThunk } from './calendar.thunks';

const initialState: CalendarState = {
  month: null,
  status: 'idle',
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCalendarThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.month = action.payload;
      })
      .addCase(fetchCalendarThunk.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default calendarSlice.reducer;
