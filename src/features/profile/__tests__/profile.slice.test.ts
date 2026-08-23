import reducer from '../profile.slice';
import { fetchProfileThunk, updatePreferencesThunk } from '../profile.thunks';
import type { ProfileState } from '../profile.types';

const initialState: ProfileState = {
  preferences: { pushRemindersEnabled: true, dailyDigestEnabled: false },
  status: 'idle',
};

describe('profile.slice', () => {
  it('updates preferences on fulfilled', () => {
    const nextPreferences = { pushRemindersEnabled: false, dailyDigestEnabled: true };
    const action = { type: updatePreferencesThunk.fulfilled.type, payload: nextPreferences };
    const state = reducer(initialState, action);
    expect(state.preferences).toEqual(nextPreferences);
    expect(state.status).toBe('succeeded');
  });

  it('sets loading status while fetching the profile', () => {
    const action = { type: fetchProfileThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('adopts fetched preferences on fulfilled, ignoring the user half of the payload', () => {
    const fetchedPreferences = { pushRemindersEnabled: false, dailyDigestEnabled: true };
    const action = {
      type: fetchProfileThunk.fulfilled.type,
      payload: {
        user: { id: 'u1', name: 'Jane Doe', email: 'jane@example.com', avatarUrl: null },
        preferences: fetchedPreferences,
      },
    };
    const state = reducer(initialState, action);
    expect(state.preferences).toEqual(fetchedPreferences);
    expect(state.status).toBe('succeeded');
  });

  it('sets failed status when the fetch is rejected', () => {
    const action = { type: fetchProfileThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
  });
});
