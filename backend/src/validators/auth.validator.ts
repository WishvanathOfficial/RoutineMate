import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().trim().email('Must be a valid email').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Must be a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().trim().min(1, 'Google credential is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>['body'];
