import * as profileService from '../services/profile.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user!.sub);
  ApiResponse.ok(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user!.sub, req.body);
  ApiResponse.ok(res, profile, 'Profile updated');
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const prefs = await profileService.updatePreferences(req.user!.sub, req.body);
  ApiResponse.ok(res, prefs, 'Preferences updated');
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await profileService.deleteAccount(req.user!.sub);
  ApiResponse.noContent(res);
});
