import { combineReducers, configureStore, type UnknownAction } from '@reduxjs/toolkit';
import authReducer from '@features/auth/auth.slice';
import { loggedOut, sessionExpired } from '@features/auth/auth.slice';
import { loginUser, logoutUser, registerUser } from '@features/auth/auth.thunks';
import { deleteAccountThunk } from '@features/profile/profile.thunks';
import uiReducer from '@features/ui/ui.slice';
import routinesReducer from '@features/routines/routines.slice';
import dashboardReducer from '@features/dashboard/dashboard.slice';
import statsReducer from '@features/stats/stats.slice';
import calendarReducer from '@features/calendar/calendar.slice';
import profileReducer from '@features/profile/profile.slice';
import landingReducer from '@features/landing/landing.slice';
import onboardingReducer from '@features/onboarding/onboarding.slice';
import goalsReducer from '@features/goals/goals.slice';
import achievementsReducer from '@features/achievements/achievements.slice';
import journalReducer from '@features/journal/journal.slice';
import notificationsReducer from '@features/notifications/notifications.slice';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  routines: routinesReducer,
  dashboard: dashboardReducer,
  stats: statsReducer,
  calendar: calendarReducer,
  profile: profileReducer,
  landing: landingReducer,
  onboarding: onboardingReducer,
  goals: goalsReducer,
  achievements: achievementsReducer,
  journal: journalReducer,
  notifications: notificationsReducer,
});

type AppState = ReturnType<typeof appReducer>;

// Every one of these signals "the logged-in identity just changed" — a
// normal logout, a forced logout from a failed silent token refresh, an
// account deletion, or a fresh login/register (covers switching straight
// from one account to another without an explicit logout in between).
//
// Without this, per-user slices (routines/goals/achievements/journal/
// notifications/stats/calendar/dashboard/profile) each gate their
// fetch-on-mount effect behind `status === 'idle'`. Once any of them
// reached 'succeeded' for user A, logging in as user B left that status
// untouched, so the guard stayed false and user A's data kept rendering
// under user B's session — see the "other user's routines visible after
// switching accounts" bug report.
const RESET_ACTION_TYPES = new Set<string>([
  loggedOut.type,
  sessionExpired.type,
  logoutUser.fulfilled.type,
  loginUser.fulfilled.type,
  registerUser.fulfilled.type,
  deleteAccountThunk.fulfilled.type,
]);

function rootReducer(state: AppState | undefined, action: UnknownAction): AppState {
  if (state && RESET_ACTION_TYPES.has(action.type)) {
    // Keep `ui` (theme/sidebar-collapsed are local device preferences, not
    // per-user server data) — wipe every other slice back to its own
    // initialState by dropping it from the state object combineReducers
    // sees, then let the action itself apply on top of those fresh
    // initialStates (e.g. loginUser.fulfilled still populates auth.user).
    state = {
      ui: state.ui,
      auth: { ...state.auth, initialized: true },
    } as AppState;
  }
  return appReducer(state, action);
}

export const store = configureStore({ reducer: rootReducer });

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
