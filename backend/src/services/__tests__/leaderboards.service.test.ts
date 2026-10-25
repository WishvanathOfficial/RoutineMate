jest.mock('../../models', () => ({
  Friendship: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
  Routine: { findAll: jest.fn() },
  User: { findAll: jest.fn() },
}));

import { Op } from 'sequelize';
import { Friendship, HabitLog, Routine, User } from '../../models';
import * as leaderboardsService from '../leaderboards.service';

describe('leaderboards.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-25T12:00:00Z'));
    (Friendship.findAll as jest.Mock).mockResolvedValue([
      { requesterId: 'self', addresseeId: 'friend' },
    ]);
    (User.findAll as jest.Mock).mockResolvedValue([
      { id: 'self', name: 'Alex', avatarUrl: null },
      { id: 'friend', name: 'Sam', avatarUrl: null },
    ]);
    (Routine.findAll as jest.Mock).mockImplementation(({ where }: { where: { userId: string } }) =>
      Promise.resolve(
        where.userId === 'friend'
          ? [
              {
                id: 'friend-routine',
                currentStreak: 4,
                frequencyType: 'weekdays',
                frequencyConfig: null,
                startDate: '2026-10-19',
                endDate: null,
              },
            ]
          : [],
      ),
    );
    (HabitLog.findAll as jest.Mock).mockResolvedValue([
      { id: 'log-1', date: '2026-10-19' },
      { id: 'log-2', date: '2026-10-20' },
      { id: 'log-3', date: '2026-10-21' },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters a friend to shared routines and computes consistency against scheduled days', async () => {
    const result = await leaderboardsService.getFriendsLeaderboard(
      'self',
      'consistency',
      '7d',
      1,
      20,
    );

    const friendRoutineQuery = (Routine.findAll as jest.Mock).mock.calls.find(
      ([options]) => options.where.userId === 'friend',
    )?.[0];
    expect(friendRoutineQuery.where).toMatchObject({
      userId: 'friend',
      status: 'active',
      visibility: { [Op.in]: ['friends', 'public'] },
    });
    expect(result.items.find((item) => item.user.id === 'friend')?.score).toBe(60);
  });
});
