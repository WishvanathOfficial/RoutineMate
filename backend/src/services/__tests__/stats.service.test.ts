jest.mock('../../models', () => ({
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
}));

import { HabitLog, Routine } from '../../models';
import * as statsService from '../stats.service';

describe('stats.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a zero-filled summary when the user has no routines', async () => {
    (Routine.findAll as jest.Mock).mockResolvedValue([]);

    const summary = await statsService.getStatsSummary('u1');

    expect(summary.totalCheckIns).toBe(0);
    expect(summary.activeRoutines).toBe(0);
    expect(summary.bestStreak).toBe(0);
    expect(summary.weekly).toHaveLength(7);
    expect(summary.trend30Day).toHaveLength(30);
    expect(summary.trend30Day.every((n) => n === 0)).toBe(true);
    expect(summary.timeOfDay).toHaveLength(4);
    expect(summary.categoryBreakdown).toEqual([]);
    expect(HabitLog.findAll).not.toHaveBeenCalled();
  });

  it('aggregates routines and habit_logs into the full summary', async () => {
    const routines = [
      { id: 'r1', category: 'Health', status: 'active', longestStreak: 5 },
      { id: 'r2', category: 'Health', status: 'active', longestStreak: 12 },
      { id: 'r3', category: 'Learning', status: 'paused', longestStreak: 3 },
    ];
    (Routine.findAll as jest.Mock).mockResolvedValue(routines);

    const today = '2026-08-20';
    (HabitLog.findAll as jest.Mock).mockResolvedValue([
      {
        routineId: 'r1',
        date: today,
        status: 'done',
        completedAt: new Date('2026-08-20T07:00:00Z'),
      },
      {
        routineId: 'r2',
        date: today,
        status: 'done',
        completedAt: new Date('2026-08-20T19:00:00Z'),
      },
      { routineId: 'r3', date: today, status: 'missed', completedAt: null },
    ]);

    const summary = await statsService.getStatsSummary('u1');

    expect(summary.activeRoutines).toBe(2);
    expect(summary.bestStreak).toBe(12);
    expect(summary.totalCheckIns).toBe(2);
    expect(summary.categoryBreakdown).toEqual(
      expect.arrayContaining([
        { category: 'Health', count: 2 },
        { category: 'Learning', count: 1 },
      ]),
    );

    const todayPoint = summary.weekly[summary.weekly.length - 1];
    expect(todayPoint.percentage).toBe(Math.round((2 / 3) * 100));

    const morning = summary.timeOfDay.find((t) => t.label === 'Morning');
    const evening = summary.timeOfDay.find((t) => t.label === 'Evening');
    expect(morning?.percentage).toBe(50);
    expect(evening?.percentage).toBe(50);
  });
});
