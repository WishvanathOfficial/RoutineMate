import { z } from 'zod';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Expected a valid calendar date');

export const saveJournalEntrySchema = z.object({
  body: z.object({
    mood: z.number().int().min(1).max(5),
    note: z.string().trim().min(1).max(2000),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// docs/RoutineMate-MVP2-Scope.md §4 site map: "/journal/:date — Single day
// entry". Same body shape as saveJournalEntrySchema, but keyed off an
// explicit date param instead of "today" — see journal.service.ts's
// saveEntryForDate().
export const getEntryByDateSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ date: dateOnly }),
  query: z.object({}).optional(),
});

export const saveEntryForDateSchema = z.object({
  body: z.object({
    mood: z.number().int().min(1).max(5),
    note: z.string().trim().min(1).max(2000),
  }),
  params: z.object({ date: dateOnly }),
  query: z.object({}).optional(),
});

export type SaveJournalEntryInput = z.infer<typeof saveJournalEntrySchema>['body'];
