import reducer from '../onboarding.slice';
import { completeOnboardingThunk, fetchOnboardingStateThunk } from '../onboarding.thunks';
import type { OnboardingState } from '../onboarding.types';

const initialState: OnboardingState = { completed: false, status: 'idle' };

describe('onboarding.slice', () => {
  it('sets loading status while completing onboarding', () => {
    const action = { type: completeOnboardingThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
    expect(state.completed).toBe(false);
  });

  it('marks onboarding as completed on fulfilled', () => {
    const action = { type: completeOnboardingThunk.fulfilled.type, payload: { completed: true } };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.completed).toBe(true);
  });

  it('sets failed status when completion is rejected', () => {
    const action = { type: completeOnboardingThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.completed).toBe(false);
  });

  it('sets failed status when completion is rejected without a payload', () => {
    const action = { type: completeOnboardingThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.completed).toBe(false);
  });

  describe('fetchOnboardingStateThunk', () => {
    it('sets loading status while fetching', () => {
      const action = { type: fetchOnboardingStateThunk.pending.type };
      const state = reducer(initialState, action);
      expect(state.status).toBe('loading');
    });

    it('adopts the fetched completed flag on fulfilled', () => {
      const action = {
        type: fetchOnboardingStateThunk.fulfilled.type,
        payload: { completed: true },
      };
      const state = reducer(initialState, action);
      expect(state.status).toBe('succeeded');
      expect(state.completed).toBe(true);
    });

    it('reflects an incomplete wizard on fulfilled', () => {
      const seeded: OnboardingState = { completed: true, status: 'idle' };
      const action = {
        type: fetchOnboardingStateThunk.fulfilled.type,
        payload: { completed: false },
      };
      const state = reducer(seeded, action);
      expect(state.completed).toBe(false);
    });

    it('sets failed status when the fetch is rejected', () => {
      const action = { type: fetchOnboardingStateThunk.rejected.type, payload: 'Network error' };
      const state = reducer(initialState, action);
      expect(state.status).toBe('failed');
    });
  });
});
