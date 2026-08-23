import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

export const selectRoutinesStatus = (state: RootState) => state.routines.status;

export const selectAllRoutines = (state: RootState) => state.routines.items;

export const selectActiveRoutines = createSelector(selectAllRoutines, (routines) =>
  routines.filter((r) => r.status === 'active'),
);

export const selectPausedRoutines = createSelector(selectAllRoutines, (routines) =>
  routines.filter((r) => r.status === 'paused'),
);

export const selectRoutineById = (id: string) => (state: RootState) =>
  state.routines.items.find((r) => r.id === id);

export const selectTodayProgress = createSelector(selectActiveRoutines, (routines) => {
  const total = routines.length;
  const done = routines.filter((r) => r.completedToday).length;
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percentage };
});

export const selectBestStreak = createSelector(selectAllRoutines, (routines) =>
  routines.reduce((max, r) => Math.max(max, r.longestStreak), 0),
);
