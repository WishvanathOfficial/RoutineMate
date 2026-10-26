import { createBundleSchema, updateBundleSchema } from '../routineBundles.validator';

const routineId = '00000000-0000-4000-8000-000000000001';
const secondRoutineId = '00000000-0000-4000-8000-000000000002';

describe('routine bundle validation', () => {
  it('requires at least two routines to create a bundle', () => {
    expect(
      createBundleSchema.safeParse({
        body: { title: 'Morning routine', routineIds: [routineId] },
        params: {},
        query: {},
      }).success,
    ).toBe(false);
    expect(
      createBundleSchema.safeParse({
        body: { title: 'Morning routine', routineIds: [routineId, secondRoutineId] },
        params: {},
        query: {},
      }).success,
    ).toBe(true);
  });

  it('requires at least two routines when updating a bundle', () => {
    expect(
      updateBundleSchema.safeParse({
        body: { routineIds: [routineId] },
        params: { id: routineId },
        query: {},
      }).success,
    ).toBe(false);
  });
});
