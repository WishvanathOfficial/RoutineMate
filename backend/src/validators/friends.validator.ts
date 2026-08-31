import { z } from 'zod';

export const friendRequestSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid().optional(),
      email: z.string().email().optional(),
      inviteToken: z.string().min(16).optional(),
    })
    .refine(
      (v) => v.userId || v.email || v.inviteToken,
      'A userId, email, or inviteToken is required',
    ),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
export const friendActionSchema = z.object({
  body: z.object({ action: z.enum(['accept', 'reject']) }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
export const friendIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
export const userSearchSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    q: z.string().trim().min(2).max(120),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  }),
});
export const publicProfileSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
