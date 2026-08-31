jest.mock('../../models', () => ({
  Achievement: { findAll: jest.fn() },
  UserAchievement: { findAll: jest.fn(), bulkCreate: jest.fn() },
  UserXp: { findOne: jest.fn(), findOrCreate: jest.fn() },
  HabitLog: { count: jest.fn() },
  Routine: { max: jest.fn(), count: jest.fn() },
  Notification: { bulkCreate: jest.fn() },
}));

import {
  Achievement,
  HabitLog,
  Notification,
  Routine,
  UserAchievement,
  UserXp,
} from '../../models';
import * as achievementsService from '../achievements.service';

function mockStats({
  totalDoneCount = 0,
  maxCurrentStreak = 0 as number | null,
  routineCount = 0,
  last28LoggedCount = 0,
  last28DoneCount = 0,
} = {}) {
  // computeUserStats issues HabitLog.count three times, in this order:
  // totalDoneCount, last28LoggedCount, last28DoneCount.
  (HabitLog.count as jest.Mock)
    .mockResolvedValueOnce(totalDoneCount)
    .mockResolvedValueOnce(last28LoggedCount)
    .mockResolvedValueOnce(last28DoneCount);
  (Routine.max as jest.Mock).mockResolvedValue(maxCurrentStreak);
  (Routine.count as jest.Mock).mockResolvedValue(routineCount);
}

describe('achievements.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-24T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('computeLevel', () => {
    it('returns level 1 with full xp remaining at 0 points', () => {
      const result = achievementsService.computeLevel(0);

      expect(result).toEqual({
        totalPoints: 0,
        level: 1,
        xpToNextLevel: 200,
        levelProgressPercent: 0,
      });
    });

    it('rolls over to the next level on an exact multiple of XP_PER_LEVEL', () => {
      const result = achievementsService.computeLevel(200);

      expect(result).toEqual({
        totalPoints: 200,
        level: 2,
        xpToNextLevel: 200,
        levelProgressPercent: 0,
      });
    });

    it('computes partial progress through a level', () => {
      const result = achievementsService.computeLevel(250);

      expect(result).toEqual({
        totalPoints: 250,
        level: 2,
        xpToNextLevel: 150,
        levelProgressPercent: 25,
      });
    });
  });

  describe('getAchievementsForUser', () => {
    const catalog = [
      {
        id: 'first-habit',
        icon: '🌱',
        title: 'First Steps',
        description: 'Complete your first habit',
      },
      {
        id: 'streak-7',
        icon: '🔥',
        title: 'Week Warrior',
        description: 'Keep a 7-day streak',
      },
      {
        id: 'streak-30',
        icon: '🔥',
        title: 'Monthly Master',
        description: 'Keep a 30-day streak',
      },
      {
        id: 'streak-100',
        icon: '🔥',
        title: 'Century Streak',
        description: 'Keep a 100-day streak',
      },
      {
        id: 'checkins-50',
        icon: '✅',
        title: 'Fifty Check-ins',
        description: 'Log 50 check-ins',
      },
      {
        id: 'perfect-week',
        icon: '🏆',
        title: 'Perfect Week',
        description: 'Complete every routine in a week',
      },
    ];

    it('shapes unlocked and locked achievements with progress labels and xp', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(catalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([
        { achievementId: 'first-habit', unlockedAt: new Date('2026-08-01T00:00:00Z') },
      ]);
      mockStats({ totalDoneCount: 40, maxCurrentStreak: 5, routineCount: 2 });
      (UserXp.findOne as jest.Mock).mockResolvedValue({ totalPoints: 250 });

      const result = await achievementsService.getAchievementsForUser('u1');

      const byId = new Map(result.items.map((i) => [i.id, i]));

      expect(byId.get('first-habit')).toEqual({
        id: 'first-habit',
        icon: '🌱',
        title: 'First Steps',
        unlockedAt: '2026-08-01',
        progressLabel: null,
      });

      expect(byId.get('streak-7')?.progressLabel).toBe('2 more days to go');
      expect(byId.get('streak-7')?.unlockedAt).toBeNull();

      expect(byId.get('streak-30')?.progressLabel).toBe('25 more days to go');
      expect(byId.get('checkins-50')?.progressLabel).toBe('10 more to go');

      // Non-rule based achievement falls back to its static description.
      expect(byId.get('perfect-week')?.progressLabel).toBe('Complete every routine in a week');

      expect(result.xp).toEqual({
        totalPoints: 250,
        level: 2,
        xpToNextLevel: 150,
        levelProgressPercent: 25,
      });
    });

    it('uses a singular "day" label when exactly one day remains on a streak', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(catalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 6, routineCount: 0 });
      (UserXp.findOne as jest.Mock).mockResolvedValue(null);

      const result = await achievementsService.getAchievementsForUser('u1');
      const streak7 = result.items.find((i) => i.id === 'streak-7');

      expect(streak7?.progressLabel).toBe('1 more day to go');
    });

    it('falls back to the static description when a streak/checkin threshold is already met but not yet recorded as unlocked', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(catalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 100, routineCount: 0 });
      (UserXp.findOne as jest.Mock).mockResolvedValue(null);

      const result = await achievementsService.getAchievementsForUser('u1');
      const streak100 = result.items.find((i) => i.id === 'streak-100');

      expect(streak100?.progressLabel).toBe('Keep a 100-day streak');
    });

    it('defaults xp totalPoints to 0 when the user has no UserXp row yet', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue([]);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats();
      (UserXp.findOne as jest.Mock).mockResolvedValue(null);

      const result = await achievementsService.getAchievementsForUser('u1');

      expect(result.items).toEqual([]);
      expect(result.xp).toEqual({
        totalPoints: 0,
        level: 1,
        xpToNextLevel: 200,
        levelProgressPercent: 0,
      });
    });
  });

  describe('evaluateAndUnlockAchievements', () => {
    const fullCatalog = [
      { id: 'first-habit', title: 'First Steps' },
      { id: 'streak-7', title: 'Week Warrior' },
      { id: 'streak-30', title: 'Monthly Master' },
      { id: 'streak-100', title: 'Century Streak' },
      { id: 'streak-365', title: 'Year-Long Streak' },
      { id: 'checkins-50', title: 'Fifty Check-ins' },
      { id: 'checkins-100', title: 'Hundred Check-ins' },
      { id: 'checkins-500', title: 'Five Hundred Check-ins' },
      { id: 'consistency-4wk', title: 'Consistency Champion' },
      { id: 'early-bird', title: 'Early Bird' },
    ];

    it('does nothing when every stat is below its unlock threshold', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 0, routineCount: 0 });

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).not.toHaveBeenCalled();
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
      expect(UserXp.findOrCreate).not.toHaveBeenCalled();
    });

    it('unlocks first-habit once routineCount crosses 1 and awards xp/notifies', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 0, routineCount: 1 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).toHaveBeenCalledWith([
        {
          userId: 'u1',
          achievementId: 'first-habit',
          unlockedAt: new Date('2026-08-24T12:00:00Z'),
        },
      ]);
      expect(Notification.bulkCreate).toHaveBeenCalledWith([
        {
          userId: 'u1',
          type: 'achievement',
          message: 'New badge unlocked: First Steps!',
          read: false,
          snoozeable: false,
          routineId: null,
        },
      ]);
      expect(UserXp.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        defaults: { userId: 'u1' },
      });
      expect(xpRow.totalPoints).toBe(50);
      expect(xpRow.save).toHaveBeenCalled();
    });

    it('does not re-unlock or re-notify an achievement the user already has', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([
        { achievementId: 'first-habit', unlockedAt: new Date('2026-08-01T00:00:00Z') },
      ]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 0, routineCount: 1 });

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).not.toHaveBeenCalled();
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
      expect(UserXp.findOrCreate).not.toHaveBeenCalled();
    });

    it('gates streak-7 independently of the higher streak thresholds', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 10, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).toHaveBeenCalledWith([
        { userId: 'u1', achievementId: 'streak-7', unlockedAt: new Date('2026-08-24T12:00:00Z') },
      ]);
    });

    it('unlocks streak-30 and streak-100 once their own thresholds are crossed', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 100, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds.sort()).toEqual(['streak-100', 'streak-30', 'streak-7']);
    });

    it('gates checkins-50 independently of checkins-100', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 50, maxCurrentStreak: 0, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds).toEqual(['checkins-50']);
    });

    it('unlocks both checkin badges once totalDoneCount crosses 100', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 100, maxCurrentStreak: 0, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds.sort()).toEqual(['checkins-100', 'checkins-50']);
      expect(xpRow.totalPoints).toBe(100); // 2 badges * 50 xp
    });

    it('only unlocks early-bird when opts.justCompletedEarly is true', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 0, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1', { justCompletedEarly: true });

      expect(UserAchievement.bulkCreate).toHaveBeenCalledWith([
        { userId: 'u1', achievementId: 'early-bird', unlockedAt: new Date('2026-08-24T12:00:00Z') },
      ]);
    });

    it('does not unlock early-bird when justCompletedEarly is false/absent', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 0, routineCount: 0 });

      await achievementsService.evaluateAndUnlockAchievements('u1', { justCompletedEarly: false });

      expect(UserAchievement.bulkCreate).not.toHaveBeenCalled();
    });

    it('ignores satisfied rules whose badge id is missing from the catalog', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue([
        { id: 'first-habit', title: 'First Steps' },
      ]);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 100, maxCurrentStreak: 100, routineCount: 1 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).toHaveBeenCalledWith([
        {
          userId: 'u1',
          achievementId: 'first-habit',
          unlockedAt: new Date('2026-08-24T12:00:00Z'),
        },
      ]);
      expect(xpRow.totalPoints).toBe(50);
    });

    it('unlocks streak-365 once maxCurrentStreak reaches 365', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 0, maxCurrentStreak: 365, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds).toContain('streak-365');
    });

    it('unlocks checkins-500 once totalDoneCount reaches 500', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ totalDoneCount: 500, maxCurrentStreak: 0, routineCount: 0 });
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds).toContain('checkins-500');
    });

    it('unlocks consistency-4wk when 28-day completion rate is at least 90% over at least 20 logged days', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ last28LoggedCount: 20, last28DoneCount: 18 }); // exactly 90%
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.evaluateAndUnlockAchievements('u1');

      const unlockedIds = (UserAchievement.bulkCreate as jest.Mock).mock.calls[0][0].map(
        (row: { achievementId: string }) => row.achievementId,
      );
      expect(unlockedIds).toContain('consistency-4wk');
    });

    it('does not unlock consistency-4wk below the 20-logged-day floor even at a 100% rate', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ last28LoggedCount: 10, last28DoneCount: 10 }); // 100%, but too few logged days

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).not.toHaveBeenCalled();
    });

    it('does not unlock consistency-4wk below the 90% rate even with enough logged days', async () => {
      (Achievement.findAll as jest.Mock).mockResolvedValue(fullCatalog);
      (UserAchievement.findAll as jest.Mock).mockResolvedValue([]);
      mockStats({ last28LoggedCount: 28, last28DoneCount: 24 }); // ~85.7%

      await achievementsService.evaluateAndUnlockAchievements('u1');

      expect(UserAchievement.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('awardCheckInXp', () => {
    it('adds XP_PER_CHECKIN to an existing UserXp row', async () => {
      const xpRow = { totalPoints: 40, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, false]);

      await achievementsService.awardCheckInXp('u1');

      expect(UserXp.findOrCreate).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        defaults: { userId: 'u1' },
      });
      expect(xpRow.totalPoints).toBe(50);
      expect(xpRow.save).toHaveBeenCalled();
    });

    it('creates a UserXp row starting from 0 when the user has none yet', async () => {
      const xpRow = { totalPoints: 0, save: jest.fn().mockResolvedValue(undefined) };
      (UserXp.findOrCreate as jest.Mock).mockResolvedValue([xpRow, true]);

      await achievementsService.awardCheckInXp('u1');

      expect(xpRow.totalPoints).toBe(10);
    });
  });
});
