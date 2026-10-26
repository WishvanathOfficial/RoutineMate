import {
  createFeedbackSchema,
  feedbackIdSchema,
  listFeedbackSchema,
  setFeedbackStatusSchema,
} from '../feedback.validator';

describe('feedback request validation', () => {
  it('accepts an idea with valid title and description', () => {
    expect(
      createFeedbackSchema.safeParse({
        body: { title: '  Calendar reminders ', description: '  Add a useful reminder.  ' },
        params: {},
        query: {},
      }).success,
    ).toBe(true);
  });

  it('rejects empty or oversized ideas and invalid status filters', () => {
    expect(
      createFeedbackSchema.safeParse({
        body: { title: '  ', description: 'idea' },
        params: {},
        query: {},
      }).success,
    ).toBe(false);
    expect(
      createFeedbackSchema.safeParse({
        body: { title: 'Idea', description: 'x'.repeat(2001) },
        params: {},
        query: {},
      }).success,
    ).toBe(false);
    expect(
      listFeedbackSchema.safeParse({ body: {}, params: {}, query: { status: 'unknown' } }).success,
    ).toBe(false);
  });

  it('requires valid feedback IDs and roadmap statuses', () => {
    expect(
      feedbackIdSchema.safeParse({ body: {}, params: { id: 'not-an-id' }, query: {} }).success,
    ).toBe(false);
    expect(
      setFeedbackStatusSchema.safeParse({
        body: { status: 'unknown' },
        params: { id: '00000000-0000-4000-8000-000000000001' },
        query: {},
      }).success,
    ).toBe(false);
  });
});
