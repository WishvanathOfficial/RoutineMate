import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const createChallengeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(1000).optional(),
    emoji: z.string().max(16).optional().default('🎯'),
    habitTemplate: z.string().max(128).optional(),
    startDate: dateOnly,
    endDate: dateOnly,
    visibility: z.enum(['public', 'private']).optional().default('public'),
    maxParticipants: z.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const discoverChallengesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
  }),
});

export const userChallengesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
  }),
});

export const challengeIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ inviteToken: z.string().min(16).optional() }).optional(),
});

export const joinChallengeSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ inviteToken: z.string().min(16).optional() }).optional(),
});

export const leaveChallengeSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const submitCheckInSchema = z.object({
  body: z.object({
    date: dateOnly,
    completed: z.boolean(),
    notes: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const addReactionSchema = z.object({
  body: z.object({
    emoji: z.string().max(16),
  }),
  params: z.object({ id: z.string().uuid(), checkInId: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const challengeLeaderboardSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>['body'];
