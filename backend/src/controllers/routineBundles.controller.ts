import * as service from '../services/routineBundles.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const list = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await service.list(req.user!.sub, Number(req.query.page), Number(req.query.pageSize)),
  ),
);
export const create = asyncHandler(async (req, res) =>
  ApiResponse.created(
    res,
    await service.create(req.user!.sub, req.body.title, req.body.routineIds),
    'Bundle created',
  ),
);
export const get = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.get(req.user!.sub, req.params.id)),
);
export const update = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await service.update(req.user!.sub, req.params.id, req.body.title, req.body.routineIds),
    'Bundle updated',
  ),
);
export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user!.sub, req.params.id);
  ApiResponse.noContent(res);
});
export const checkIn = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await service.checkIn(req.user!.sub, req.params.id, req.body.completed),
    'Bundle check-in saved',
  ),
);
