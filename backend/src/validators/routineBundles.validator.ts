import { z } from 'zod';
export const bundleListSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(6),
  }),
});
export const bundleIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
export const createBundleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120),
    routineIds: z.array(z.string().uuid()).min(1).max(50),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
export const updateBundleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    routineIds: z.array(z.string().uuid()).min(2).max(50).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
export const bundleCheckInSchema = z.object({
  body: z.object({ completed: z.boolean() }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
