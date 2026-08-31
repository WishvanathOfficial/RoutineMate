import type { RoutineCategory } from '@features/routines/routines.types';

/** Reuses the same 5 categories Routines already models — see
 * docs/RoutineMate-MVP2-Scope.md §3.4 "pick 1–3 goal categories". */
export const ONBOARDING_CATEGORIES: { category: RoutineCategory; emoji: string }[] = [
  { category: 'Health', emoji: '💪' },
  { category: 'Mindfulness', emoji: '🧘' },
  { category: 'Learning', emoji: '📚' },
  { category: 'Productivity', emoji: '🚀' },
  { category: 'Wellness', emoji: '🌿' },
];

export interface OnboardingSelection {
  categories: RoutineCategory[];
  habitNames: string[];
  reminderTime: string;
}

export type OnboardingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface OnboardingState {
  /** Whether the wizard has been completed, ever — persisted server-side in
   * the `onboarding_states` table (see
   * backend/src/services/onboarding.service.ts). ProtectedRoute fetches
   * this once per authenticated session (fetchOnboardingStateThunk) and
   * uses it to enforce "triggered once": an incomplete user gets routed to
   * /onboarding from anywhere in the app, and a completed user gets routed
   * away from /onboarding if they try to revisit it. */
  completed: boolean;
  status: OnboardingStatus;
}
