import reducer from '../achievements.slice';
import { fetchAchievementsThunk } from '../achievements.thunks';
import type { Achievement, AchievementsState, UserXp } from '../achievements.types';

const sampleAchievement: Achievement = {
  id: 'ach-1',
  icon: 'fa-solid fa-medal',
  title: '7-Day Streak',
  unlockedAt: '2026-08-18',
  progressLabel: null,
};

const sampleXp: UserXp = {
  totalPoints: 240,
  level: 3,
  xpToNextLevel: 60,
  levelProgressPercent: 80,
};

const initialState: AchievementsState = {
  items: [],
  xp: null,
  status: 'idle',
  error: null,
};

describe('achievements.slice', () => {
  it('sets loading status while fetching achievements', () => {
    const action = { type: fetchAchievementsThunk.pending.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('loading');
  });

  it('stores achievements and xp on fetch fulfilled', () => {
    const action = {
      type: fetchAchievementsThunk.fulfilled.type,
      payload: { items: [sampleAchievement], xp: sampleXp },
    };
    const state = reducer(initialState, action);
    expect(state.status).toBe('succeeded');
    expect(state.items).toHaveLength(1);
    expect(state.xp).toEqual(sampleXp);
  });

  it('overwrites previously stored xp on a subsequent fetch fulfilled', () => {
    const seeded: AchievementsState = { ...initialState, items: [sampleAchievement], xp: sampleXp };
    const updatedXp: UserXp = { ...sampleXp, totalPoints: 300, level: 4 };
    const action = {
      type: fetchAchievementsThunk.fulfilled.type,
      payload: { items: [sampleAchievement], xp: updatedXp },
    };
    const state = reducer(seeded, action);
    expect(state.xp).toEqual(updatedXp);
  });

  it('stores the extracted error message when fetch is rejected', () => {
    const action = { type: fetchAchievementsThunk.rejected.type, payload: 'Network error' };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('falls back to a generic message when fetch is rejected without a payload', () => {
    const action = { type: fetchAchievementsThunk.rejected.type };
    const state = reducer(initialState, action);
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Failed to load achievements.');
  });
});
