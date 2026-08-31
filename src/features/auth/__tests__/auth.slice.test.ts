import {
  deleteAccountThunk,
  fetchProfileThunk,
  updateAccountThunk,
} from '@features/profile/profile.thunks';
import reducer, { loggedOut, sessionExpired } from '../auth.slice';
import {
  bootstrapSessionThunk,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
} from '../auth.thunks';
import type { AuthSession, AuthState, User } from '../auth.types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
  initialized: false,
};

const fakeUser: User = { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' };

const fakeSession: AuthSession = { user: fakeUser, accessToken: 'access-token-1' };

describe('auth.slice', () => {
  it('sets status to loading while login is pending', () => {
    const action = { type: loginUser.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the user and access token on successful login', () => {
    const action = { type: loginUser.fulfilled.type, payload: fakeSession };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.user).toEqual(fakeUser);
    expect(state.accessToken).toBe('access-token-1');
  });

  it('stores an error message when login is rejected', () => {
    const action = { type: loginUser.rejected.type, payload: 'Invalid email or password.' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Invalid email or password.');
  });

  it('stores the user and access token on successful Google login', () => {
    const action = { type: loginWithGoogle.fulfilled.type, payload: fakeSession };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.user).toEqual(fakeUser);
    expect(state.accessToken).toBe('access-token-1');
  });

  it('stores the user and access token on successful registration', () => {
    const action = { type: registerUser.fulfilled.type, payload: fakeSession };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.user).toEqual(fakeUser);
    expect(state.accessToken).toBe('access-token-1');
  });

  it('clears the session on logout', () => {
    const loggedInState: AuthState = {
      user: fakeUser,
      accessToken: 'access-token-1',
      status: 'succeeded',
      error: null,
      initialized: true,
    };
    const state = reducer(loggedInState, loggedOut());
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.status).toBe('idle');
  });

  describe('logoutUser', () => {
    it('clears the session on successful logout', () => {
      const loggedInState: AuthState = {
        user: fakeUser,
        accessToken: 'access-token-1',
        status: 'succeeded',
        error: null,
        initialized: true,
      };
      const state = reducer(loggedInState, { type: logoutUser.fulfilled.type });
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.status).toBe('idle');
    });
  });

  describe('bootstrapSessionThunk', () => {
    it('marks the session as initialized without logging in when there is no existing session', () => {
      const action = { type: bootstrapSessionThunk.fulfilled.type, payload: null };
      const state = reducer(initialState, action);
      expect(state.initialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    });

    it('resumes the session when a valid refresh cookie exists', () => {
      const action = { type: bootstrapSessionThunk.fulfilled.type, payload: fakeSession };
      const state = reducer(initialState, action);
      expect(state.initialized).toBe(true);
      expect(state.user).toEqual(fakeUser);
      expect(state.accessToken).toBe('access-token-1');
    });

    it('marks initialized even if the thunk unexpectedly rejects', () => {
      const action = { type: bootstrapSessionThunk.rejected.type };
      const state = reducer(initialState, action);
      expect(state.initialized).toBe(true);
    });
  });

  describe('profile thunks (cross-slice sync)', () => {
    const loggedInState: AuthState = {
      user: fakeUser,
      accessToken: 'access-token-1',
      status: 'succeeded',
      error: null,
      initialized: true,
    };

    it('refreshes the user from a successful profile fetch', () => {
      const fetchedUser: User = { ...fakeUser, name: 'Jane Q. Doe', avatarUrl: 'https://x/y.png' };
      const action = {
        type: fetchProfileThunk.fulfilled.type,
        payload: {
          user: fetchedUser,
          preferences: { pushRemindersEnabled: true, dailyDigestEnabled: false },
        },
      };
      const state = reducer(loggedInState, action);
      expect(state.user).toEqual(fetchedUser);
    });

    it('applies the saved name/email from a successful account update', () => {
      const action = {
        type: updateAccountThunk.fulfilled.type,
        payload: { name: 'New Name', email: 'new@example.com' },
      };
      const state = reducer(loggedInState, action);
      expect(state.user).toEqual({ ...fakeUser, name: 'New Name', email: 'new@example.com' });
    });

    it('does nothing on account update fulfilled when logged out', () => {
      const action = {
        type: updateAccountThunk.fulfilled.type,
        payload: { name: 'New Name', email: 'new@example.com' },
      };
      const state = reducer(initialState, action);
      expect(state.user).toBeNull();
    });

    it('clears the session on successful account deletion', () => {
      const state = reducer(loggedInState, { type: deleteAccountThunk.fulfilled.type });
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.status).toBe('idle');
    });
  });

  describe('sessionExpired', () => {
    it('clears the session and marks it initialized', () => {
      const loggedInState: AuthState = {
        user: fakeUser,
        accessToken: 'access-token-1',
        status: 'succeeded',
        error: null,
        initialized: true,
      };
      const state = reducer(loggedInState, sessionExpired());
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.initialized).toBe(true);
    });
  });
});
