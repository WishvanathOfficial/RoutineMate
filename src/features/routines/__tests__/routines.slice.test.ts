import reducer from '../routines.slice';
import {
  createRoutineThunk,
  deleteRoutineThunk,
  fetchRoutinesThunk,
  syncOfflineCheckInsThunk,
  toggleCheckInThunk,
} from '../routines.thunks';
import type { Routine, RoutinesState } from '../routines.types';

const sampleRoutine: Routine = {
  id: 'routine-1',
  name: 'Drink Water',
  emoji: '💧',
  category: 'Health',
  frequency: 'Daily',
  reminderType: 'time',
  reminderTime: '08:00',
  reminderLocation: null,
  status: 'active',
  streak: 3,
  longestStreak: 5,
  completedToday: false,
  createdAt: '2026-08-01T00:00:00.000Z',
};

const initialState: RoutinesState = { items: [], status: 'idle', error: null };

describe('routines.slice', () => {
  it('stores routines on fetch fulfilled', () => {
    const action = { type: fetchRoutinesThunk.fulfilled.type, payload: [sampleRoutine] };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.items).toHaveLength(1);
  });

  it('prepends a new routine on create fulfilled', () => {
    const seeded: RoutinesState = { ...initialState, items: [sampleRoutine] };
    const newRoutine: Routine = { ...sampleRoutine, id: 'routine-2', name: 'Meditate' };
    const action = { type: createRoutineThunk.fulfilled.type, payload: newRoutine };
    const state = reducer(seeded, action);
    expect(state.items[0].id).toBe('routine-2');
    expect(state.items).toHaveLength(2);
  });

  it('removes a routine on delete fulfilled', () => {
    const seeded: RoutinesState = { ...initialState, items: [sampleRoutine] };
    const action = { type: deleteRoutineThunk.fulfilled.type, payload: { id: 'routine-1' } };
    const state = reducer(seeded, action);
    expect(state.items).toHaveLength(0);
  });

  it('increments streak and marks completed on check-in toggle', () => {
    const seeded: RoutinesState = { ...initialState, items: [sampleRoutine] };
    const updated: Routine = { ...sampleRoutine, completedToday: true, streak: 4 };
    const action = { type: toggleCheckInThunk.fulfilled.type, payload: updated };
    const state = reducer(seeded, action);
    expect(state.items[0].completedToday).toBe(true);
    expect(state.items[0].streak).toBe(4);
  });

  it('merges every routine returned by a successful offline sync', () => {
    const secondRoutine: Routine = { ...sampleRoutine, id: 'routine-2', name: 'Meditate' };
    const seeded: RoutinesState = { ...initialState, items: [sampleRoutine, secondRoutine] };
    const updatedFirst: Routine = { ...sampleRoutine, completedToday: true, streak: 4 };
    const updatedSecond: Routine = { ...secondRoutine, completedToday: true, streak: 2 };
    const action = {
      type: syncOfflineCheckInsThunk.fulfilled.type,
      payload: [updatedFirst, updatedSecond],
    };
    const state = reducer(seeded, action);
    expect(state.items[0].completedToday).toBe(true);
    expect(state.items[0].streak).toBe(4);
    expect(state.items[1].completedToday).toBe(true);
    expect(state.items[1].streak).toBe(2);
  });

  it('leaves routines untouched when an offline sync has nothing queued', () => {
    const seeded: RoutinesState = { ...initialState, items: [sampleRoutine] };
    const action = { type: syncOfflineCheckInsThunk.fulfilled.type, payload: [] };
    const state = reducer(seeded, action);
    expect(state.items).toEqual([sampleRoutine]);
  });

  it('stores the extracted error message when fetch is rejected', () => {
    const action = { type: fetchRoutinesThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when fetch is rejected without a payload', () => {
    const action = { type: fetchRoutinesThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load routines.');
  });
});
