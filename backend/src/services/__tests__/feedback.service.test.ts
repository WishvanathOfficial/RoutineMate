jest.mock('../../models', () => ({
  FeedbackItem: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  FeedbackVote: {
    destroy: jest.fn(),
    findAll: jest.fn(),
    findOrCreate: jest.fn(),
  },
}));

import { FeedbackItem, FeedbackVote } from '../../models';
import * as feedbackService from '../feedback.service';

function mockFeedbackItem(overrides: Record<string, unknown> = {}) {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Calendar reminders',
    description: 'Add a reminder before routines.',
    votes: 4,
    status: 'planned',
    createdAt: new Date('2026-10-25T10:00:00.000Z'),
    save: jest.fn(),
    ...overrides,
  };
}

describe('feedback.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns whether the current user has voted without exposing the submitter', async () => {
    (FeedbackItem.findAll as jest.Mock).mockResolvedValue([mockFeedbackItem()]);
    (FeedbackVote.findAll as jest.Mock).mockResolvedValue([
      { feedbackId: '00000000-0000-4000-8000-000000000001' },
    ]);

    const result = await feedbackService.list(undefined, 'user-1');

    expect(result).toEqual([
      expect.objectContaining({
        id: '00000000-0000-4000-8000-000000000001',
        votes: 4,
        hasVoted: true,
      }),
    ]);
    expect(result[0]).not.toHaveProperty('userId');
  });

  it('returns zero-vote state for a new idea', async () => {
    (FeedbackItem.create as jest.Mock).mockResolvedValue(
      mockFeedbackItem({ votes: 0, title: 'New feature' }),
    );

    const result = await feedbackService.create('user-1', 'New feature', 'A useful idea.');

    expect(result).toMatchObject({ title: 'New feature', votes: 0, hasVoted: false });
  });

  it('increments once for a new vote and indicates it is active', async () => {
    const item = mockFeedbackItem();
    (FeedbackItem.findByPk as jest.Mock).mockResolvedValue(item);
    (FeedbackVote.findOrCreate as jest.Mock).mockResolvedValue([{}, true]);

    const result = await feedbackService.vote('user-1', item.id);

    expect(item.votes).toBe(5);
    expect(item.save).toHaveBeenCalledTimes(1);
    expect(result.hasVoted).toBe(true);
  });

  it('decrements once when the current user removes their vote', async () => {
    const item = mockFeedbackItem();
    (FeedbackItem.findByPk as jest.Mock).mockResolvedValue(item);
    (FeedbackVote.destroy as jest.Mock).mockResolvedValue(1);

    const result = await feedbackService.unvote('user-1', item.id);

    expect(item.votes).toBe(3);
    expect(item.save).toHaveBeenCalledTimes(1);
    expect(result.hasVoted).toBe(false);
  });
});
