import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import type { OnboardingSelection } from './onboarding.types';

// docs/RoutineMate-MVP2-Scope.md §3.4 "triggered once" — read on
// login/session-bootstrap by ProtectedRoute so a user who never finished
// the wizard (or already has) is routed correctly regardless of how they
// arrived. See backend/src/services/onboarding.service.ts's
// getOnboardingState().
export async function fetchOnboardingState(): Promise<{ completed: boolean }> {
  return httpClient.get('/api/onboarding').then(unwrap<{ completed: boolean }>);
}

// Real backend call — see backend/src/services/onboarding.service.ts.
// `habitNames` isn't sent here: those starter habits are already real
// routines by this point (created via the existing routines API in
// onboarding.thunks.ts) — this call only records the wizard's own
// completion + category/reminder preferences.
export async function completeOnboarding(
  selection: OnboardingSelection,
): Promise<{ completed: true }> {
  return httpClient
    .post('/api/onboarding/complete', {
      categories: selection.categories,
      reminderTime: selection.reminderTime,
    })
    .then(unwrap<{ completed: true }>);
}
