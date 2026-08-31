import { z } from 'zod';

const category = z.enum(['Health', 'Mindfulness', 'Learning', 'Wellness', 'Productivity']);
const frequencyType = z.enum(['daily', 'weekdays', 'specific_days', 'interval']);
const reminderType = z.enum(['time', 'location']);
const visibility = z.enum(['private', 'friends', 'public']);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const frequencyConfig = z
  .object({
    days: z.array(z.number().int().min(0).max(6)).optional(),
    everyNDays: z.number().int().min(1).optional(),
  })
  .optional();

export const routineIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const routineHistorySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ days: z.coerce.number().int().min(1).max(90).optional() }).optional(),
});

export const createRoutineSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    emoji: z.string().trim().min(1).max(16).optional(),
    category,
    frequencyType,
    frequencyConfig,
    reminderType: reminderType.optional(),
    reminderTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/)
      .optional(),
    reminderLocation: z.string().trim().max(255).optional(),
    targetValue: z.number().int().positive().optional(),
    targetUnit: z.string().trim().max(30).optional(),
    startDate: dateOnly.optional(),
    endDate: dateOnly.optional(),
    visibility: visibility.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateRoutineSchema = z.object({
  body: createRoutineSchema.shape.body.partial(),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const checkInSchema = z.object({
  body: z.object({
    status: z.enum(['done', 'partial', 'skipped', 'missed']),
    date: dateOnly.optional(), // defaults to today in the service layer
    value: z.number().optional(),
    note: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({}).optional(),
});

export const listRoutinesQuerySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(['active', 'paused', 'archived']).optional(),
    category: category.optional(),
  }),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>['body'];
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>['body'];
export type CheckInInput = z.infer<typeof checkInSchema>['body'];
