import { OnboardingState } from '../models';
import { OnboardingState as OnboardingStateModel } from '../models/onboardingState.model';
import type { CompleteOnboardingInput } from '../validators/onboarding.validator';

// docs/RoutineMate-MVP2-Scope.md §5 "OnboardingState". The wizard's starter
// habits are already real routines by the time completeOnboarding() fires
// (created via the existing routines API) — this only tracks the wizard's
// own completion flag plus the category/reminder preferences picked in it.

function toDto(state: OnboardingStateModel) {
  return {
    completed: state.completed,
    completedAt: state.completedAt ? state.completedAt.toISOString() : null,
    categories: state.categories ?? [],
    reminderTime: state.reminderTime,
  };
}

async function findOrCreateState(userId: string): Promise<OnboardingStateModel> {
  const [state] = await OnboardingState.findOrCreate({ where: { userId }, defaults: { userId } });
  return state;
}

export async function getOnboardingState(userId: string) {
  return toDto(await findOrCreateState(userId));
}

export async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
  const state = await findOrCreateState(userId);
  state.completed = true;
  state.completedAt = new Date();
  state.categories = input.categories;
  if (input.reminderTime) state.reminderTime = input.reminderTime;
  await state.save();
  return { completed: true as const };
}
