export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface AuthState {
  user: User | null;
  /** In-memory only — never persisted. See src/api/tokenStore.ts for why. */
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
  /**
   * Whether the one-time startup session check (bootstrapSessionThunk) has
   * settled yet. ProtectedRoute uses this — not `status` — to decide
   * between "still checking for an existing session" and "definitely
   * logged out", since `status` is reused by login/register too.
   */
  initialized: boolean;
}
