import axios from 'axios';

/** Shape of an error response body — see error.middleware.ts on the backend. */
export interface BackendErrorBody {
  success: false;
  message: string;
  errors?: unknown;
}

/**
 * Normalizes any error thrown by an httpClient call into a plain string,
 * preferring the backend's `{ message }` envelope over generic axios/network
 * text. Intended for thunks: `rejectWithValue(extractApiErrorMessage(err))`.
 */
export function extractApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError<BackendErrorBody>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/** Field-level validation errors, when the backend rejects a zod-validated body with a 400. */
export function extractApiFieldErrors(error: unknown): unknown {
  if (axios.isAxiosError<BackendErrorBody>(error)) {
    return error.response?.data?.errors;
  }
  return undefined;
}

/**
 * True for a request that never got a response at all — offline, DNS
 * failure, the server unreachable, etc. — as opposed to one the server
 * actively rejected (4xx/5xx, which has `error.response`). Used to decide
 * whether a failed check-in should be queued for offline sync rather than
 * surfaced as a normal error — see routines.thunks.ts's toggleCheckInThunk.
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
