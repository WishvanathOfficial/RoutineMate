import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(160),
    targetDate: dateOnly,
    linkedRoutineIds: z.array(z.string().uuid()).max(20).optional().default([]),
    // docs/RoutineMate-MVP2-Scope.md §3.2 "manual milestone checkpoints" —
    // client only supplies titles; ids/done are assigned server-side, see
    // goals.service.ts's createGoal().
    milestones: z
      .array(z.object({ title: z.string().trim().min(1).max(120) }))
      .max(20)
      .optional()
      .default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listGoalsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const toggleMilestoneSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
    milestoneId: z.string().uuid(),
  }),
  query: z.object({}).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>['body'];
