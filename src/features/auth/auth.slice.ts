import { createSlice } from '@reduxjs/toolkit';
import {
  deleteAccountThunk,
  fetchProfileThunk,
  updateAccountThunk,
} from '@features/profile/profile.thunks';
import type { AuthState } from './auth.types';
import { bootstrapSessionThunk, loginUser, logoutUser, registerUser } from './auth.thunks';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
    },
    /** Dispatched by AuthSessionBridge when httpClient's silent refresh fails irrecoverably. */
    sessionExpired(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
      state.initialized = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Login failed.';
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Registration failed.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(bootstrapSessionThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSessionThunk.fulfilled, (state, action) => {
        state.status = 'idle';
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
      })
      .addCase(bootstrapSessionThunk.rejected, (state) => {
        // refreshSessionRequest never rejects (it swallows failures to
        // null), so this is a defensive fallback only.
        state.status = 'idle';
        state.initialized = true;
      })
      // The profile feature owns fetch/update/delete, but the resulting
      // user identity is authoritative auth state — kept in sync here
      // instead of duplicating a `user` copy in profile.slice.ts.
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateAccountThunk.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, name: action.payload.name, email: action.payload.email };
        }
      })
      .addCase(deleteAccountThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
      });
  },
});

export const { loggedOut, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
