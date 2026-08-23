import { z } from 'zod';

export const calendarQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
  }),
});
