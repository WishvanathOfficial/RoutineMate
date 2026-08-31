import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});
