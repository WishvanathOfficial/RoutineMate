import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import { completeOnboarding, fetchOnboardingState } from './onboarding.api';
import type { OnboardingSelection } from './onboarding.types';

export const completeOnboardingThunk = createAsyncThunk<
  { completed: true },
  OnboardingSelection,
  { rejectValue: string }
>('onboarding/complete', async (selection, { rejectWithValue }) => {
  try {
    return await completeOnboarding(selection);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to finish onboarding.'));
  }
});

/** Backs ProtectedRoute's once-only enforcement — see onboarding.api.ts. */
export const fetchOnboardingStateThunk = createAsyncThunk<
  { completed: boolean },
  void,
  { rejectValue: string }
>('onboarding/fetchState', async (_, { rejectWithValue }) => {
  try {
    return await fetchOnboardingState();
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load onboarding state.'));
  }
});
