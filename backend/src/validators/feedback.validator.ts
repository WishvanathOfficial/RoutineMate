import { z } from 'zod';

const feedbackStatus = z.enum(['planned', 'in-progress', 'shipped']);
const feedbackId = z.string().uuid();

export const listFeedbackSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({ status: feedbackStatus.optional() }).optional(),
});

export const createFeedbackSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(5).max(2000),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const feedbackIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: feedbackId }),
  query: z.object({}).optional(),
});

export const setFeedbackStatusSchema = z.object({
  body: z.object({ status: feedbackStatus }),
  params: z.object({ id: feedbackId }),
  query: z.object({}).optional(),
});
