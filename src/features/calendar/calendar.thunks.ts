import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import { fetchCalendarMonth } from './calendar.api';
import type { CalendarMonth } from './calendar.types';

export const fetchCalendarThunk = createAsyncThunk<
  CalendarMonth,
  string | undefined,
  { rejectValue: string }
>('calendar/fetchMonth', async (month, { rejectWithValue }) => {
  try {
    return await fetchCalendarMonth(month);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load calendar.'));
  }
});
