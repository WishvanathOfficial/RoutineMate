import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@app/store';

export const selectAchievementsStatus = (state: RootState) => state.achievements.status;

export const selectAllAchievements = (state: RootState) => state.achievements.items;

export const selectUserXp = (state: RootState) => state.achievements.xp;

export const selectUnlockedAchievements = createSelector(selectAllAchievements, (items) =>
  items.filter((a) => a.unlockedAt !== null),
);

/** Most recently unlocked badge — used for the Dashboard widget. */
export const selectMostRecentAchievement = createSelector(selectUnlockedAchievements, (unlocked) =>
  unlocked.length === 0
    ? null
    : [...unlocked].sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))[0],
);
