import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '@app/store';
import { extractApiErrorMessage } from '@api/apiError';
import { toastShown } from '@features/ui/ui.slice';
import { fetchNotificationsThunk } from '@features/notifications/notifications.thunks';
import { fetchAchievements } from './achievements.api';
import { selectAllAchievements } from './achievements.selectors';
import type { Achievement, UserXp } from './achievements.types';

export const fetchAchievementsThunk = createAsyncThunk<
  { items: Achievement[]; xp: UserXp },
  void,
  { rejectValue: string }
>('achievements/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchAchievements();
  } catch (err) {
    return rejectWithValue(extractApiErrorMessage(err, 'Failed to load achievements.'));
  }
});

/**
 * Call after any routine activity that could unlock a badge (a check-in or
 * creating a routine) — see backend/src/services/achievements.service.ts's
 * best-effort unlock engine, which runs server-side as a fire-and-forget
 * side effect of those same actions. The frontend has no in-band signal for
 * whether that side effect actually unlocked anything, so this re-fetches
 * achievements, diffs against what was already unlocked in the store, and
 * toasts for anything new. Also refreshes notifications, since a
 * newly-unlocked badge creates one there too — without this, both the
 * Achievements page and the notification bell stayed stale until a full
 * page reload.
 */
export function refreshAchievementsAfterActivity() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const previouslyUnlockedIds = new Set(
      selectAllAchievements(getState())
        .filter((a) => a.unlockedAt)
        .map((a) => a.id),
    );

    const result = await dispatch(fetchAchievementsThunk());
    if (fetchAchievementsThunk.fulfilled.match(result)) {
      result.payload.items
        .filter((a) => a.unlockedAt && !previouslyUnlockedIds.has(a.id))
        .forEach((achievement) => {
          dispatch(toastShown(`🏆 New badge unlocked: ${achievement.title}!`));
        });
    }

    dispatch(fetchNotificationsThunk());
  };
}
