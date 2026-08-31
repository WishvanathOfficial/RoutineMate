import * as onboardingService from '../services/onboarding.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getState = asyncHandler(async (req, res) => {
  const state = await onboardingService.getOnboardingState(req.user!.sub);
  ApiResponse.ok(res, state);
});

export const complete = asyncHandler(async (req, res) => {
  const result = await onboardingService.completeOnboarding(req.user!.sub, req.body);
  ApiResponse.ok(res, result, 'Onboarding complete');
});
