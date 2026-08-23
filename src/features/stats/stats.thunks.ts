import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import { fetchStatsSummary } from './stats.api';
import type { StatsSummary } from './stats.types';

export const fetchStatsThunk = createAsyncThunk<StatsSummary, void, { rejectValue: string }>(
  'stats/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchStatsSummary();
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to load stats.'));
    }
  },
);
