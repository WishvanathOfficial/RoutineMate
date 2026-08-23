import * as statsService from '../services/stats.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await statsService.getStatsSummary(req.user!.sub);
  ApiResponse.ok(res, summary);
});
