import { z } from 'zod';
export const createFocusSchema = z.object({
  body: z.object({ routineId: z.string().uuid().nullable().optional() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
export const updateFocusSchema = z.object({
  body: z.object({
    status: z.enum(['paused', 'running', 'cancelled']).optional(),
    durationSeconds: z.number().int().min(0).max(86400).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
export const focusIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
