import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

export const selectGoalsStatus = (state: RootState) => state.goals.status;

export const selectAllGoals = (state: RootState) => state.goals.items;

export const selectActiveGoals = createSelector(selectAllGoals, (goals) =>
  goals.filter((g) => g.status === 'active'),
);

/** Most-recently-created active goal — used for the Dashboard widget. */
export const selectFeaturedGoal = createSelector(selectActiveGoals, (goals) => goals[0] ?? null);
