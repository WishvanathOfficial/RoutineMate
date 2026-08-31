import { z } from 'zod';
export const leaderboardQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    metric: z.enum(['streak', 'consistency', 'checkins']).default('streak'),
    scope: z.literal('friends').default('friends'),
    window: z.enum(['7d', '30d', 'all']).default('7d'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  }),
});
