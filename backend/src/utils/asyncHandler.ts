import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wraps async controller functions so rejected promises are forwarded to
// Express's error middleware instead of crashing the process. Returning the
// promise (rather than firing-and-forgetting it) is harmless for Express —
// route handlers' return values are ignored — and lets tests `await` a
// controller call directly instead of racing the microtask queue.
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): Promise<void> =>
    Promise.resolve(handler(req, res, next))
      .then(() => undefined)
      .catch(next);
}
