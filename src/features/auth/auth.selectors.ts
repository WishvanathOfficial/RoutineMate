import type { RootState } from '@app/store';

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.user);
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
/** Whether the startup session check has settled — see AuthState.initialized. */
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
