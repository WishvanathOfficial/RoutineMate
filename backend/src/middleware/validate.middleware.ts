import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validates and replaces req.body / req.params / req.query with the parsed
 * (and type-coerced) result of a zod schema shaped as
 * `z.object({ body, params, query })`. Throws ZodError on failure, caught by
 * error.middleware.ts.
 */
export function validate(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    }) as { body?: unknown; params?: unknown; query?: unknown };

    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
    if (parsed.query !== undefined) req.query = parsed.query as typeof req.query;

    next();
  };
}
