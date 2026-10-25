jest.mock('../../models', () => ({
  Challenge: { findByPk: jest.fn(), update: jest.fn() },
  ChallengeCheckIn: { findAll: jest.fn(), count: jest.fn() },
  ChallengeReaction: {},
  User: { findByPk: jest.fn() },
}));

import { Op } from 'sequelize';
import { Challenge } from '../../models';
import * as challengesService from '../challenges.service';

function makeChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: 'challenge-1',
    creatorId: 'creator-1',
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
});
