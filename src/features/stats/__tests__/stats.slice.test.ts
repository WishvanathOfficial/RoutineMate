import reducer from '../stats.slice';
import { fetchStatsThunk } from '../stats.thunks';
import type { StatsState, StatsSummary } from '../stats.types';

const initialState: StatsState = { summary: null, status: 'idle', error: null };

const sampleSummary: StatsSummary = {
  totalCheckIns: 100,
  completionRate: 75,
  bestStreak: 20,
  activeRoutines: 4,
  weekly: [],
  categoryBreakdown: [],
  trend30Day: [],
  timeOfDay: [],
  moodCorrelation: [],
  moodInsight: null,
};

describe('stats.slice', () => {
  it('sets status to loading while fetching', () => {
    const state = reducer(initialState, { type: fetchStatsThunk.pending.type });
    expect(state.status).toBe('loading');
  });

  it('stores the summary on fulfilled', () => {
    const action = { type: fetchStatsThunk.fulfilled.type, payload: sampleSummary };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.summary).toEqual(sampleSummary);
  });

  it('stores the extracted error message on rejected', () => {
    const action = { type: fetchStatsThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when rejected without a payload', () => {
    const action = { type: fetchStatsThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load stats.');
  });
});
