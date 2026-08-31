import type { RootState } from '@app/store';

export const selectOnboardingCompleted = (state: RootState) => state.onboarding.completed;
export const selectOnboardingStatus = (state: RootState) => state.onboarding.status;
