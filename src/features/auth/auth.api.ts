import { extractApiErrorMessage } from '@api/apiError';
import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import { clearAccessToken, setAccessToken } from '@api/tokenStore';
import type { AuthSession, LoginCredentials, RegisterPayload } from './auth.types';

// Real backend calls — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.1 "Auth". Function signatures match what the old in-memory mock used to
// return (a Promise the thunks can await / catch), so auth.thunks.ts didn't
// need to change shape, only the payload type (User -> AuthSession).

export async function loginRequest(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    const session = await httpClient.post('/api/auth/login', credentials).then(unwrap<AuthSession>);
    setAccessToken(session.accessToken);
    return session;
  } catch (err) {
    throw new Error(extractApiErrorMessage(err, 'Login failed.'));
  }
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthSession> {
  try {
    const session = await httpClient.post('/api/auth/register', payload).then(unwrap<AuthSession>);
    setAccessToken(session.accessToken);
    return session;
  } catch (err) {
    throw new Error(extractApiErrorMessage(err, 'Registration failed.'));
  }
}

/**
 * Revokes the refresh token server-side and clears the cookie. Best-effort:
 * if the network call fails (offline, already-expired session, etc.) the
 * local access token is still cleared so the UI reflects a logged-out user
 * either way — logout should never get "stuck" behind a failed request.
 */
export async function logoutRequest(): Promise<void> {
  try {
    await httpClient.post('/api/auth/logout');
  } catch {
    // Intentionally swallowed — see doc comment above.
  } finally {
    clearAccessToken();
  }
}

/**
 * Attempts to resume a session using the httpOnly refresh-token cookie the
 * backend sets on login/register. Called once at app startup — see
 * bootstrapSessionThunk. Returns null (not a rejected promise) on any
 * failure, since "no existing session" is an expected, not exceptional,
 * outcome for a first-time visitor.
 */
export async function refreshSessionRequest(): Promise<AuthSession | null> {
  try {
    const session = await httpClient.post('/api/auth/refresh').then(unwrap<AuthSession>);
    setAccessToken(session.accessToken);
    return session;
  } catch {
    return null;
  }
}
