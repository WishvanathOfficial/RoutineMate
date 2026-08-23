import type { AxiosResponse } from 'axios';

/** Every backend endpoint responds with this envelope — see ApiResponse.ts on the backend. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Unwraps `{ success, message, data }` down to `data`. Use as `.then(unwrap)`. */
export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  return response.data.data;
}
