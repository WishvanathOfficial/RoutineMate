import * as goalsService from '../services/goals.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const goals = await goalsService.listGoals(req.user!.sub);
  ApiResponse.ok(res, goals);
});

export const create = asyncHandler(async (req, res) => {
  const goal = await goalsService.createGoal(req.user!.sub, req.body);
  ApiResponse.created(res, goal, 'Goal created');
});

export const toggleMilestone = asyncHandler(async (req, res) => {
  const goal = await goalsService.toggleMilestone(
    req.user!.sub,
    req.params.id,
    req.params.milestoneId,
  );
  ApiResponse.ok(res, goal);
});
