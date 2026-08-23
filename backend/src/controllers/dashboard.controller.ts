import { User } from '../models';
import * as dashboardService from '../services/dashboard.service';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getGreeting = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user!.sub);
  if (!user) throw ApiError.notFound('User not found');
  ApiResponse.ok(res, dashboardService.getGreeting(user.name));
});

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getDashboardOverview(req.user!.sub);
  ApiResponse.ok(res, overview);
});
