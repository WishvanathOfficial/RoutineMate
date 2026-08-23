import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    avatarUrl: z.string().trim().url().max(500).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    pushRemindersEnabled: z.boolean().optional(),
    dailyDigestEnabled: z.boolean().optional(),
    firstDayOfWeek: z.enum(['sunday', 'monday']).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>['body'];
