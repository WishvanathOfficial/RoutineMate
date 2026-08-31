import * as service from '../services/friends.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const list = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.list(req.user!.sub)),
);
export const request = asyncHandler(async (req, res) =>
  ApiResponse.created(res, await service.request(req.user!.sub, req.body), 'Friend request sent'),
);
export const action = asyncHandler(async (req, res) =>
  ApiResponse.ok(
    res,
    await service.action(req.user!.sub, req.params.id, req.body.action),
    'Friend request updated',
  ),
);
export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.user!.sub, req.params.id);
  ApiResponse.noContent(res);
});
export const search = asyncHandler(async (req, res) => {
  const q = req.query as any;
  ApiResponse.ok(res, await service.search(req.user!.sub, q.q, q.page, q.pageSize));
});
export const profile = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.profile(req.user!.sub, req.params.id)),
);
