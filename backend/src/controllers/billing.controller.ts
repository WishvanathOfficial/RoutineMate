import * as service from '../services/billing.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
export const subscription = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.getSubscription(req.user!.sub)),
);
export const checkout = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.checkout(req.user!.sub)),
);
export const portal = asyncHandler(async (req, res) =>
  ApiResponse.ok(res, await service.portal(req.user!.sub)),
);
export const webhook = asyncHandler(async (req, res) => {
  await service.handleWebhook(
    JSON.stringify(req.body),
    req.headers['stripe-signature'] as string | undefined,
  );
  ApiResponse.ok(res, { received: true });
});
