import * as achievementsService from '../services/achievements.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const result = await achievementsService.getAchievementsForUser(req.user!.sub);
  ApiResponse.ok(res, result);
});
