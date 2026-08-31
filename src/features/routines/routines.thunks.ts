import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage, isNetworkError } from '@api/apiError';
import { getQueuedCheckIns, queueCheckIn, removeQueuedCheckIn } from '@offline/offlineCheckInQueue';
import { toastShown } from '@features/ui/ui.slice';
import * as routinesApi from './routines.api';
import { applyOptimisticCheckIn } from './routines.mapper';
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
  /** The full routine as it currently stands — needed (not just id +
   * completedToday) so an offline fallback can build an optimistic update
   * without a separate store lookup. */
  routine: Routine;
}

/**
 * Normal path: check in against the backend and return the authoritative
 * result. Offline path (see src/offline/offlineCheckInQueue.ts): a network
 * error (not a server-rejected request — see isNetworkError) queues the
 * intended status for later sync and resolves with a best-effort local
 * update instead of failing outright, so a check-in tap while offline still
 * feels like it worked.
 */
export const toggleCheckInThunk = createAsyncThunk<
  Routine,
  ToggleCheckInArgs,
  { rejectValue: string }
>('routines/toggleCheckIn', async ({ routine }, { rejectWithValue, dispatch }) => {
  const targetStatus: 'done' | 'skipped' = routine.completedToday ? 'skipped' : 'done';
  try {
    return await routinesApi.checkInStatus(routine.id, targetStatus);
  } catch (err) {
    if (isNetworkError(err)) {
      await queueCheckIn(routine.id, targetStatus);
      dispatch(toastShown("You're offline — this check-in will sync automatically."));
      return applyOptimisticCheckIn(routine, targetStatus);
    }
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to update check-in.'));
  }
});

/**
 * Replays every queued offline check-in against the real API, in the order
 * they were made. Called on reconnect (see src/app/OfflineSyncBridge.tsx).
 * A queued entry that still fails (still offline, or a transient error) is
 * left in the queue for the next sync attempt rather than dropped.
 */
export const syncOfflineCheckInsThunk = createAsyncThunk<Routine[]>(
  'routines/syncOfflineCheckIns',
  async () => {
    const queued = await getQueuedCheckIns();
    const synced: Routine[] = [];
    for (const item of queued) {
      try {
        const routine = await routinesApi.checkInStatus(item.routineId, item.status);
        await removeQueuedCheckIn(item.routineId);
        synced.push(routine);
      } catch {
        // Still failing (still offline, or a transient error) — leave it
        // queued and pick it up on the next sync trigger.
      }
    }
    return synced;
  },
);

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
