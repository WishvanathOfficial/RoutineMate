import { getEntryByDateSchema, saveEntryForDateSchema } from '../journal.validator';

describe('journal date validation', () => {
  it('accepts a real calendar date', () => {
    expect(
      getEntryByDateSchema.safeParse({
        params: { date: '2024-02-29' },
        body: {},
        query: {},
      }).success,
    ).toBe(true);
  });

  it('rejects impossible dates instead of accepting a matching date string shape', () => {
    expect(
      getEntryByDateSchema.safeParse({
        params: { date: '2026-02-30' },
        body: {},
        query: {},
      }).success,
    ).toBe(false);
    expect(
      saveEntryForDateSchema.safeParse({
        params: { date: '2026-13-01' },
        body: { mood: 4, note: 'Reflection' },
        query: {},
      }).success,
    ).toBe(false);
  });
});
