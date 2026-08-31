import * as routinesService from '../services/routines.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const list = asyncHandler(async (req, res) => {
  const { status, category } = req.query as { status?: string; category?: string };
  const routines = await routinesService.listRoutines(req.user!.sub, { status, category });
  ApiResponse.ok(res, routines);
});

export const getOne = asyncHandler(async (req, res) => {
  const routine = await routinesService.getRoutine(req.user!.sub, req.params.id);
  ApiResponse.ok(res, routine);
});

export const history = asyncHandler(async (req, res) => {
  const days = (req.query as { days?: number }).days;
  const result = await routinesService.getRoutineHistory(req.user!.sub, req.params.id, days);
  ApiResponse.ok(res, result);
});

export const create = asyncHandler(async (req, res) => {
  const routine = await routinesService.createRoutine(req.user!.sub, req.body);
  ApiResponse.created(res, routine, 'Routine created');
});

export const update = asyncHandler(async (req, res) => {
  const routine = await routinesService.updateRoutine(req.user!.sub, req.params.id, req.body);
  ApiResponse.ok(res, routine, 'Routine updated');
});

export const remove = asyncHandler(async (req, res) => {
  await routinesService.deleteRoutine(req.user!.sub, req.params.id);
  ApiResponse.noContent(res);
});

export const pause = asyncHandler(async (req, res) => {
  const routine = await routinesService.togglePause(req.user!.sub, req.params.id);
  ApiResponse.ok(res, routine, 'Routine status updated');
});

export const checkIn = asyncHandler(async (req, res) => {
  const result = await routinesService.checkIn(req.user!.sub, req.params.id, req.body);
  ApiResponse.ok(res, result, 'Checked in');
});
