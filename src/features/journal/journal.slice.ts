import { createSlice } from '@reduxjs/toolkit';
import type { JournalState } from './journal.types';
import {
  createJournalEntryThunk,
  fetchJournalEntriesThunk,
  fetchJournalEntryByDateThunk,
  saveJournalEntryForDateThunk,
} from './journal.thunks';

const initialState: JournalState = {
  items: [],
  status: 'idle',
  error: null,
};

const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJournalEntriesThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchJournalEntriesThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchJournalEntriesThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to load journal entries.';
      })
      .addCase(createJournalEntryThunk.fulfilled, (state, action) => {
        // One entry per day — replace today's entry if present, else prepend.
        state.items = [
          action.payload,
          ...state.items.filter((e) => e.date !== action.payload.date),
        ];
      })
      .addCase(fetchJournalEntryByDateThunk.fulfilled, (state, action) => {
        const { date, entry } = action.payload;
        if (entry) {
          state.items = [entry, ...state.items.filter((e) => e.date !== date)];
        }
      })
      .addCase(saveJournalEntryForDateThunk.fulfilled, (state, action) => {
        state.items = [
          action.payload,
          ...state.items.filter((e) => e.date !== action.payload.date),
        ];
      });
  },
});

export default journalSlice.reducer;
