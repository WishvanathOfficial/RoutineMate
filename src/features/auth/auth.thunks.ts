import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginRequest, logoutRequest, refreshSessionRequest, registerRequest } from './auth.api';
import type { AuthSession, LoginCredentials, RegisterPayload } from './auth.types';

export const loginUser = createAsyncThunk<AuthSession, LoginCredentials, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginRequest(credentials);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Login failed.');
    }
  },
);

export const registerUser = createAsyncThunk<AuthSession, RegisterPayload, { rejectValue: string }>(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await registerRequest(payload);
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Registration failed.');
    }
  },
);

/**
 * Runs once at app startup (see AuthSessionBridge). Resolves to the session
 * if the httpOnly refresh cookie from a previous login is still valid, or
 * null if there isn't one / it's expired — both are normal outcomes, so
 * this never rejects.
 */
export const bootstrapSessionThunk = createAsyncThunk<AuthSession | null>(
  'auth/bootstrapSession',
  async () => refreshSessionRequest(),
);

/**
 * logoutRequest() never throws (see auth.api.ts) — it always clears local
 * state even if the server call itself fails — so this thunk always
 * fulfills, keeping the slice's logout handling to a single case.
 */
export const logoutUser = createAsyncThunk<void, void>('auth/logout', async () => {
  await logoutRequest();
});
