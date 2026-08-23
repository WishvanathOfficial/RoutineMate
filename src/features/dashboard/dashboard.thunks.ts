import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import { fetchGreeting } from './dashboard.api';
import type { DashboardGreeting } from './dashboard.types';

export const fetchGreetingThunk = createAsyncThunk<
  DashboardGreeting,
  string,
  { rejectValue: string }
>('dashboard/fetchGreeting', async (name, { rejectWithValue }) => {
  try {
    return await fetchGreeting(name);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load greeting.'));
  }
});
