jest.mock('../../models', () => ({
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
}));

import { HabitLog, Routine } from '../../models';
import * as dashboardService from '../dashboard.service';

describe('dashboard.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGreeting', () => {
    it('returns the given name paired with a non-empty quote', () => {
      const result = dashboardService.getGreeting('Wishvanath');

      expect(result.name).toBe('Wishvanath');
      expect(typeof result.quote).toBe('string');
      expect(result.quote.length).toBeGreaterThan(0);
    });
  });

  describe('getDashboardOverview', () => {
    it("aggregates active routines and today's completion", async () => {
      const routines = [
        { id: 'r1', longestStreak: 4, toJSON: () => ({ id: 'r1', longestStreak: 4 }) },
        { id: 'r2', longestStreak: 9, toJSON: () => ({ id: 'r2', longestStreak: 9 }) },
      ];
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1', status: 'done' }]);

      const overview = await dashboardService.getDashboardOverview('u1');

      expect(overview.activeRoutineCount).toBe(2);
      expect(overview.todayCompletedCount).toBe(1);
      expect(overview.todayProgressPercentage).toBe(50);
      expect(overview.bestStreak).toBe(9);
      expect(overview.todayRoutines).toEqual([
        { id: 'r1', longestStreak: 4, completedToday: true },
        { id: 'r2', longestStreak: 9, completedToday: false },
      ]);
    });

    it('returns 0% progress and 0 best streak when there are no active routines', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue([]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([]);

      const overview = await dashboardService.getDashboardOverview('u1');

      expect(overview.activeRoutineCount).toBe(0);
      expect(overview.todayProgressPercentage).toBe(0);
      expect(overview.bestStreak).toBe(0);
      expect(overview.todayRoutines).toEqual([]);
    });
  });
});
