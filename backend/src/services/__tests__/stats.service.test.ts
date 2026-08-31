jest.mock('../../models', () => ({
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
  JournalEntry: { findAll: jest.fn() },
}));

import { HabitLog, JournalEntry, Routine } from '../../models';
import * as statsService from '../stats.service';

describe('stats.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T12:00:00Z'));
    (JournalEntry.findAll as jest.Mock).mockResolvedValue([]);
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
    expect(summary.moodCorrelation).toEqual([]);
    expect(summary.moodInsight).toBeNull();
    expect(HabitLog.findAll).not.toHaveBeenCalled();
    expect(JournalEntry.findAll).not.toHaveBeenCalled();
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

  describe('mood-vs-completion correlation', () => {
    const routines = [
      { id: 'r1', category: 'Health', status: 'active', longestStreak: 5 },
      { id: 'r2', category: 'Health', status: 'active', longestStreak: 5 },
    ];

    it('returns no points or insight when the user has no journal entries', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([]);

      const summary = await statsService.getStatsSummary('u1');

      expect(summary.moodCorrelation).toEqual([]);
      expect(summary.moodInsight).toBeNull();
    });

    it('averages completion percentage per mood value across matching days', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', date: '2026-08-18', status: 'done' },
        { routineId: 'r2', date: '2026-08-18', status: 'done' }, // 100% on a mood-5 day
        { routineId: 'r1', date: '2026-08-19', status: 'missed' },
        { routineId: 'r2', date: '2026-08-19', status: 'missed' }, // 0% on a mood-2 day
      ]);
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([
        { date: '2026-08-18', mood: 5 },
        { date: '2026-08-19', mood: 2 },
      ]);

      const summary = await statsService.getStatsSummary('u1');

      expect(summary.moodCorrelation).toEqual(
        expect.arrayContaining([
          { mood: 2, avgCompletionPercentage: 0, entryCount: 1 },
          { mood: 5, avgCompletionPercentage: 100, entryCount: 1 },
        ]),
      );
      expect(summary.moodInsight).toBe(
        'You complete 100% more habits on days you log a positive mood.',
      );
    });

    it('averages multiple days logged with the same mood value into one point', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', date: '2026-08-18', status: 'done' },
        { routineId: 'r2', date: '2026-08-18', status: 'missed' }, // 50%
        { routineId: 'r1', date: '2026-08-19', status: 'done' },
        { routineId: 'r2', date: '2026-08-19', status: 'done' }, // 100%
      ]);
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([
        { date: '2026-08-18', mood: 4 },
        { date: '2026-08-19', mood: 4 },
      ]);

      const summary = await statsService.getStatsSummary('u1');

      expect(summary.moodCorrelation).toEqual([
        { mood: 4, avgCompletionPercentage: 75, entryCount: 2 },
      ]);
    });

    it('returns points but no insight when only one side of the positive/negative comparison has data', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', date: '2026-08-18', status: 'done' },
        { routineId: 'r2', date: '2026-08-18', status: 'done' },
      ]);
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([{ date: '2026-08-18', mood: 5 }]);

      const summary = await statsService.getStatsSummary('u1');

      expect(summary.moodCorrelation).toEqual([
        { mood: 5, avgCompletionPercentage: 100, entryCount: 1 },
      ]);
      expect(summary.moodInsight).toBeNull();
    });

    it('excludes neutral mood-3 days from the positive/negative comparison', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
      (JournalEntry.findAll as jest.Mock).mockResolvedValue([{ date: '2026-08-18', mood: 3 }]);

      const summary = await statsService.getStatsSummary('u1');

      expect(summary.moodInsight).toBeNull();
    });
  });
});
