import reducer from '../dashboard.slice';
import { fetchGreetingThunk } from '../dashboard.thunks';
import type { DashboardState } from '../dashboard.types';

const initialState: DashboardState = { greeting: null, status: 'idle' };

describe('dashboard.slice', () => {
  it('stores the greeting on fetch fulfilled', () => {
    const payload = { name: 'Jane', quote: 'Keep going.' };
    const action = { type: fetchGreetingThunk.fulfilled.type, payload };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.greeting).toEqual(payload);
  });

  it('sets status to failed on rejection', () => {
    const action = { type: fetchGreetingThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
  });
});
