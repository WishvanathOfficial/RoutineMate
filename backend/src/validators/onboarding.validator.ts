import { z } from 'zod';

const category = z.enum(['Health', 'Mindfulness', 'Learning', 'Wellness', 'Productivity']);

// Note: the wizard's starter-habit names aren't persisted here — they're
// already real routines by the time this fires (created via the existing
// POST /api/routines, see src/features/onboarding/OnboardingPage.tsx). This
// only records the wizard's own completion + category/reminder preferences.
export const completeOnboardingSchema = z.object({
  body: z.object({
    categories: z.array(category).max(5).optional().default([]),
    reminderTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>['body'];
