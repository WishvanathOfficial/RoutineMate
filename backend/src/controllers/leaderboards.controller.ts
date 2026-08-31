import * as service from '../services/leaderboards.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const friends = asyncHandler(async (req, res) => {
  const q = req.query as any;
  ApiResponse.ok(
    res,
    await service.getFriendsLeaderboard(req.user!.sub, q.metric, q.window, q.page, q.pageSize),
  );
});
