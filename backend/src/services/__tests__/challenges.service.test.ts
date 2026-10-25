jest.mock('../../models', () => ({
  Challenge: { findByPk: jest.fn(), findAll: jest.fn(), update: jest.fn() },
  ChallengeCheckIn: { findAll: jest.fn(), count: jest.fn(), findOrCreate: jest.fn() },
  ChallengeReaction: {},
  User: { findByPk: jest.fn() },
}));

import { Op } from 'sequelize';
import { Challenge, ChallengeCheckIn } from '../../models';
import * as challengesService from '../challenges.service';

function makeChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: 'challenge-1',
    creatorId: 'creator-1',
    startDate: '2026-10-20',
    endDate: '2026-10-24',
    status: 'active',
    participantIds: ['creator-1', 'member-1'],
    participantCount: 2,
    destroy: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('challenges.service ownership and archival', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-25T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('deleteChallenge', () => {
    it('allows the creator to delete their challenge', async () => {
      const challenge = makeChallenge();
      (Challenge.findByPk as jest.Mock).mockResolvedValue(challenge);

      await challengesService.deleteChallenge('challenge-1', 'creator-1');

      expect(challenge.destroy).toHaveBeenCalledTimes(1);
    });

    it('rejects deletion by a non-creator', async () => {
      const challenge = makeChallenge();
      (Challenge.findByPk as jest.Mock).mockResolvedValue(challenge);

      await expect(
        challengesService.deleteChallenge('challenge-1', 'member-1'),
      ).rejects.toMatchObject({ statusCode: 403 });
      expect(challenge.destroy).not.toHaveBeenCalled();
    });
  });

  describe('archiveExpiredChallenges', () => {
    it('archives active challenges with an end date before today', async () => {
      await challengesService.archiveExpiredChallenges();

      expect(Challenge.update).toHaveBeenCalledWith(
        { status: 'archived' },
        { where: { status: 'active', endDate: { [Op.lt]: '2026-10-25' } } },
      );
    });
  });

  describe('submitCheckIn', () => {
    it.each(['2026-10-19', '2026-10-26', '2026-02-30'])(
      'rejects an invalid or out-of-window date (%s)',
      async (date) => {
        const challenge = makeChallenge({ endDate: '2026-10-30' });
        (Challenge.findByPk as jest.Mock).mockResolvedValue(challenge);

        await expect(
          challengesService.submitCheckIn('challenge-1', 'member-1', date, true),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(ChallengeCheckIn.findOrCreate).not.toHaveBeenCalled();
      },
    );

    it('accepts a date within the challenge window and upserts by participant and date', async () => {
      const challenge = makeChallenge({ endDate: '2026-10-30' });
      const checkIn = {
        id: 'check-in-1',
        date: '2026-10-25',
        completed: true,
        notes: '',
        save: jest.fn(),
      };
      (Challenge.findByPk as jest.Mock).mockResolvedValue(challenge);
      (ChallengeCheckIn.findOrCreate as jest.Mock).mockResolvedValue([checkIn, true]);

      const result = await challengesService.submitCheckIn(
        'challenge-1',
        'member-1',
        '2026-10-25',
        true,
      );

      expect(ChallengeCheckIn.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { challengeId: 'challenge-1', userId: 'member-1', date: '2026-10-25' },
        }),
      );
      expect(result).toEqual({
        id: 'check-in-1',
        date: '2026-10-25',
        completed: true,
        notes: undefined,
      });
    });
  });

  describe('getUserChallenges progress', () => {
    it('returns percentage progress and completed/eligible day counts', async () => {
      const challenge = makeChallenge({
        startDate: '2026-10-20',
        endDate: '2026-10-30',
        status: 'active',
      });
      (Challenge.findAll as jest.Mock).mockResolvedValue([challenge]);
      (ChallengeCheckIn.count as jest.Mock).mockResolvedValue(3);

      const result = await challengesService.getUserChallenges('member-1');

      expect(result[0]).toMatchObject({
        userProgress: 50,
        userCompletedDays: 3,
        userEligibleDays: 6,
      });
      expect(ChallengeCheckIn.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { [Op.between]: ['2026-10-20', '2026-10-25'] },
          }),
        }),
      );
    });
  });
});
