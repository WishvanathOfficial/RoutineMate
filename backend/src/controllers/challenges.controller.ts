import * as challengesService from '../services/challenges.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const discover = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const challenges = await challengesService.discoverChallenges(req.user!.sub, limit, offset);
  ApiResponse.ok(res, challenges);
});

export const getUserChallenges = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  const challenges = await challengesService.getUserChallenges(req.user!.sub, limit, offset);
  ApiResponse.ok(res, challenges);
});

export const create = asyncHandler(async (req, res) => {
  const challenge = await challengesService.createChallenge(req.user!.sub, req.body);
  ApiResponse.created(res, challenge, 'Challenge created');
});

export const remove = asyncHandler(async (req, res) => {
  await challengesService.deleteChallenge(req.params.id, req.user!.sub);
  ApiResponse.noContent(res);
});

export const getDetail = asyncHandler(async (req, res) => {
  const challenge = await challengesService.getChallengeDetail(
    req.params.id,
    req.user!.sub,
    req.query.inviteToken as string | undefined,
  );
  ApiResponse.ok(res, challenge);
});

export const join = asyncHandler(async (req, res) => {
  const challenge = await challengesService.joinChallenge(
    req.params.id,
    req.user!.sub,
    req.query.inviteToken as string | undefined,
  );
  ApiResponse.ok(res, challenge, 'Joined challenge');
});

export const leave = asyncHandler(async (req, res) => {
  const challenge = await challengesService.leaveChallenge(req.params.id, req.user!.sub);
  ApiResponse.ok(res, challenge, 'Left challenge');
});

export const submitCheckIn = asyncHandler(async (req, res) => {
  const { date, completed, notes } = req.body;
  const checkIn = await challengesService.submitCheckIn(
    req.params.id,
    req.user!.sub,
    date,
    completed,
    notes,
  );
  ApiResponse.ok(res, checkIn, 'Check-in submitted');
});

export const addReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const reaction = await challengesService.addReaction(req.params.checkInId, req.user!.sub, emoji);
  ApiResponse.created(res, reaction, 'Reaction added');
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const leaderboard = await challengesService.getChallengeLeaderboard(req.params.id, limit);
  ApiResponse.ok(res, leaderboard);
});
