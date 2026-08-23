import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import * as routinesApi from './routines.api';
import type { CreateRoutineInput, Routine, UpdateRoutineInput } from './routines.types';

export const fetchRoutinesThunk = createAsyncThunk<Routine[], void, { rejectValue: string }>(
  'routines/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await routinesApi.fetchRoutines();
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to load routines.'));
    }
  },
);

export const createRoutineThunk = createAsyncThunk<
  Routine,
  CreateRoutineInput,
  { rejectValue: string }
>('routines/create', async (input, { rejectWithValue }) => {
  try {
    return await routinesApi.createRoutine(input);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to create routine.'));
  }
});

export const updateRoutineThunk = createAsyncThunk<
  Routine,
  UpdateRoutineInput,
  { rejectValue: string }
>('routines/update', async (input, { rejectWithValue }) => {
  try {
    return await routinesApi.updateRoutine(input);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to update routine.'));
  }
});

export const deleteRoutineThunk = createAsyncThunk<{ id: string }, string, { rejectValue: string }>(
  'routines/delete',
  async (id, { rejectWithValue }) => {
    try {
      return await routinesApi.deleteRoutine(id);
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to delete routine.'));
    }
  },
);

export interface ToggleCheckInArgs {
  id: string;
  /** The routine's completedToday *before* this toggle — decides done vs skipped. */
  completedToday: boolean;
}

export const toggleCheckInThunk = createAsyncThunk<
  Routine,
  ToggleCheckInArgs,
  { rejectValue: string }
>('routines/toggleCheckIn', async ({ id, completedToday }, { rejectWithValue }) => {
  try {
    return await routinesApi.toggleCheckIn(id, completedToday);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to update check-in.'));
  }
});

export const togglePauseThunk = createAsyncThunk<Routine, string, { rejectValue: string }>(
  'routines/togglePause',
  async (id, { rejectWithValue }) => {
    try {
      return await routinesApi.togglePause(id);
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to update routine.'));
    }
  },
);
