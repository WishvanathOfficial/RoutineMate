import reducer from '../goals.slice';
import { createGoalThunk, fetchGoalsThunk, toggleGoalMilestoneThunk } from '../goals.thunks';
import type { Goal, GoalsState } from '../goals.types';

const sampleGoal: Goal = {
  id: 'goal-1',
  title: 'Run a 5k',
  emoji: '🏃',
  targetDate: '2026-12-31',
  status: 'active',
  progress: 40,
  linkedRoutineIds: ['routine-1'],
  milestones: [],
  completedAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
};

const initialState: GoalsState = { items: [], status: 'idle', error: null };

describe('goals.slice', () => {
  it('sets loading status while fetching goals', () => {
    const action = { type: fetchGoalsThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('stores goals on fetch fulfilled', () => {
    const action = { type: fetchGoalsThunk.fulfilled.type, payload: [sampleGoal] };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.items).toHaveLength(1);
    expect(state.items[0].progress).toBe(40);
  });

  it('prepends a new goal on create fulfilled', () => {
    const seeded: GoalsState = { ...initialState, items: [sampleGoal] };
    const newGoal: Goal = { ...sampleGoal, id: 'goal-2', title: 'Read 12 books', progress: 0 };
    const action = { type: createGoalThunk.fulfilled.type, payload: newGoal };
    const state = reducer(seeded, action);
    expect(state.items[0].id).toBe('goal-2');
    expect(state.items).toHaveLength(2);
  });

  it('stores the extracted error message when fetch is rejected', () => {
    const action = { type: fetchGoalsThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when fetch is rejected without a payload', () => {
    const action = { type: fetchGoalsThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load goals.');
  });

  it('replaces the matching goal in place on toggleMilestone fulfilled', () => {
    const otherGoal: Goal = { ...sampleGoal, id: 'goal-2', progress: 10 };
    const seeded: GoalsState = { ...initialState, items: [sampleGoal, otherGoal] };
    const updatedGoal: Goal = {
      ...sampleGoal,
      progress: 100,
      status: 'completed',
      milestones: [{ id: 'm1', title: 'Run 1K', done: true }],
    };
    const action = { type: toggleGoalMilestoneThunk.fulfilled.type, payload: updatedGoal };

    const state = reducer(seeded, action);

    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toEqual(updatedGoal);
    expect(state.items[1]).toEqual(otherGoal);
  });

  it('leaves items untouched when the toggled goal is not in the current list', () => {
    const seeded: GoalsState = { ...initialState, items: [sampleGoal] };
    const action = {
      type: toggleGoalMilestoneThunk.fulfilled.type,
      payload: { ...sampleGoal, id: 'not-in-list' },
    };

    const state = reducer(seeded, action);

    expect(state.items).toEqual([sampleGoal]);
  });
});
