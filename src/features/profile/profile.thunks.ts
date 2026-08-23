import { createAsyncThunk } from '@reduxjs/toolkit';
import { extractApiErrorMessage } from '@api/apiError';
import {
  deleteAccount,
  fetchProfile,
  updateAccount,
  updatePreferences,
  type ProfileSnapshot,
} from './profile.api';
import type { AccountUpdateInput, ProfilePreferences } from './profile.types';

/** Dispatched on ProfilePage mount — see auth.slice.ts for how the returned
 * user also refreshes the authoritative auth state. */
export const fetchProfileThunk = createAsyncThunk<ProfileSnapshot, void, { rejectValue: string }>(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchProfile();
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to load profile.'));
    }
  },
);

export const updateAccountThunk = createAsyncThunk<
  AccountUpdateInput,
  AccountUpdateInput,
  { rejectValue: string }
>('profile/updateAccount', async (input, { rejectWithValue }) => {
  try {
    return await updateAccount(input);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to save account details.'));
  }
});

export const updatePreferencesThunk = createAsyncThunk<
  ProfilePreferences,
  ProfilePreferences,
  { rejectValue: string }
>('profile/updatePreferences', async (preferences, { rejectWithValue }) => {
  try {
    return await updatePreferences(preferences);
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to save preferences.'));
  }
});

/** auth.slice.ts clears the session on fulfillment — see its extraReducers. */
export const deleteAccountThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'profile/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await deleteAccount();
    } catch (err) {
      return rejectWithValue(extractApiErrorMessage(err, 'Failed to delete account.'));
    }
  },
);
