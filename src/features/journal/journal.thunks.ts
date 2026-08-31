import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import {
  createJournalEntry,
  fetchJournalEntries,
  fetchJournalEntryByDate,
  saveJournalEntryForDate,
} from './journal.api';
import type { CreateJournalEntryInput, JournalEntry } from './journal.types';

export const fetchJournalEntriesThunk = createAsyncThunk<
  JournalEntry[],
  void,
  { rejectValue: string }
>('journal/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchJournalEntries();
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load journal entries.'));
  }
});

export const createJournalEntryThunk = createAsyncThunk<
  JournalEntry,
  CreateJournalEntryInput,
  { rejectValue: string }
>('journal/create', async (input, { rejectWithValue }) => {
  try {
    return await createJournalEntry(input);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to save journal entry.'));
  }
});

/** Backs the /journal/:date single-day page. Returns `entry: null` (not a
 * rejection) when nothing was logged for that day — that's an expected,
 * normal state here, not an error. */
export const fetchJournalEntryByDateThunk = createAsyncThunk<
  { date: string; entry: JournalEntry | null },
  string,
  { rejectValue: string }
>('journal/fetchByDate', async (date, { rejectWithValue }) => {
  try {
    const entry = await fetchJournalEntryByDate(date);
    return { date, entry };
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load journal entry.'));
  }
});

export interface SaveJournalEntryForDateArgs {
  date: string;
  input: CreateJournalEntryInput;
}

export const saveJournalEntryForDateThunk = createAsyncThunk<
  JournalEntry,
  SaveJournalEntryForDateArgs,
  { rejectValue: string }
>('journal/saveForDate', async ({ date, input }, { rejectWithValue }) => {
  try {
    return await saveJournalEntryForDate(date, input);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to save journal entry.'));
  }
});
