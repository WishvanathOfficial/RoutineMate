jest.mock('../../models', () => ({
  Routine: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  HabitLog: { findAll: jest.fn(), findOne: jest.fn(), findOrCreate: jest.fn() },
  sequelize: { transaction: jest.fn() },
}));

import { HabitLog, Routine, sequelize } from '../../models';
import * as routinesService from '../routines.service';

describe('routines.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listRoutines', () => {
    it('returns an empty array without querying habit_logs when there are no routines', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue([]);

      const result = await routinesService.listRoutines('u1', {});

      expect(result).toEqual([]);
      expect(HabitLog.findAll).not.toHaveBeenCalled();
    });

    it("flags completedToday based on the day's habit_logs", async () => {
      const routineA = { id: 'r1', toJSON: () => ({ id: 'r1', name: 'A' }) };
      const routineB = { id: 'r2', toJSON: () => ({ id: 'r2', name: 'B' }) };
      (Routine.findAll as jest.Mock).mockResolvedValue([routineA, routineB]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1', status: 'done' }]);

      const result = await routinesService.listRoutines('u1', {});

      expect(result).toEqual([
        { id: 'r1', name: 'A', completedToday: true },
        { id: 'r2', name: 'B', completedToday: false },
      ]);
    });

    it('applies status and category filters', async () => {
      (Routine.findAll as jest.Mock).mockResolvedValue([]);

      await routinesService.listRoutines('u1', { status: 'active', category: 'Health' });

      expect(Routine.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1', status: 'active', category: 'Health' } }),
      );
    });
  });

  describe('getRoutine', () => {
    it('throws not found when the routine is not owned by the user', async () => {
      (Routine.findOne as jest.Mock).mockResolvedValue(null);

      await expect(routinesService.getRoutine('u1', 'missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("returns the routine with completedToday derived from today's log", async () => {
      const routine = { id: 'r1', toJSON: () => ({ id: 'r1' }) };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);
      (HabitLog.findOne as jest.Mock).mockResolvedValue({ status: 'done' });

      const result = await routinesService.getRoutine('u1', 'r1');

      expect(result).toEqual({ id: 'r1', completedToday: true });
    });
  });

  describe('createRoutine', () => {
    it('applies sensible defaults for optional fields', async () => {
      const created = { toJSON: () => ({ id: 'new' }) };
      (Routine.create as jest.Mock).mockResolvedValue(created);

      const result = await routinesService.createRoutine('u1', {
        name: 'Read',
        category: 'Learning',
        frequencyType: 'daily',
      } as never);

      expect(Routine.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          name: 'Read',
          emoji: '✅',
          category: 'Learning',
          frequencyType: 'daily',
          reminderType: 'time',
        }),
      );
      expect(result).toEqual({ id: 'new' });
    });
  });

  describe('updateRoutine', () => {
    it('throws not found for a routine not owned by the user', async () => {
      (Routine.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        routinesService.updateRoutine('u1', 'r1', { name: 'x' } as never),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('applies the partial update and saves', async () => {
      const routine = {
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ id: 'r1', name: 'Updated' }),
      };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      const result = await routinesService.updateRoutine('u1', 'r1', { name: 'Updated' } as never);

      expect(routine.set).toHaveBeenCalledWith({ name: 'Updated' });
      expect(routine.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'r1', name: 'Updated' });
    });
  });

  describe('deleteRoutine', () => {
    it('throws not found for a routine not owned by the user', async () => {
      (Routine.findOne as jest.Mock).mockResolvedValue(null);

      await expect(routinesService.deleteRoutine('u1', 'missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('soft-deletes an owned routine', async () => {
      const routine = { destroy: jest.fn().mockResolvedValue(undefined) };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      await routinesService.deleteRoutine('u1', 'r1');

      expect(routine.destroy).toHaveBeenCalled();
    });
  });

  describe('togglePause', () => {
    it('toggles active to paused', async () => {
      const routine = { status: 'active', save: jest.fn().mockResolvedValue(undefined) };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      await routinesService.togglePause('u1', 'r1');

      expect(routine.status).toBe('paused');
      expect(routine.save).toHaveBeenCalled();
    });

    it('toggles paused back to active', async () => {
      const routine = { status: 'paused', save: jest.fn().mockResolvedValue(undefined) };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      await routinesService.togglePause('u1', 'r1');

      expect(routine.status).toBe('active');
    });

    it('rejects toggling an archived routine', async () => {
      (Routine.findOne as jest.Mock).mockResolvedValue({ status: 'archived' });

      await expect(routinesService.togglePause('u1', 'r1')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('checkIn', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-20T12:00:00Z'));
      (sequelize.transaction as jest.Mock).mockImplementation(async (cb: (t: unknown) => unknown) =>
        cb({}),
      );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('throws not found when the routine is not owned by the user', async () => {
      (Routine.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        routinesService.checkIn('u1', 'missing', { status: 'done' } as never),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('upserts the habit log and recomputes the streak from habit_logs', async () => {
      const routine = {
        id: 'r1',
        frequencyType: 'daily',
        frequencyConfig: null,
        startDate: '2026-08-18',
        longestStreak: 0,
        currentStreak: 0,
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ id: 'r1' }),
      };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      const logInstance = {
        status: 'partial',
        value: null as string | null,
        note: null as string | null,
        completedAt: null as Date | null,
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ id: 'log-1', status: 'done' }),
      };
      (HabitLog.findOrCreate as jest.Mock).mockResolvedValue([logInstance, false]);

      // Three consecutive daily 'done' logs ending today -> streak of 3.
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { date: '2026-08-18', status: 'done' },
        { date: '2026-08-19', status: 'done' },
        { date: '2026-08-20', status: 'done' },
      ]);

      const result = await routinesService.checkIn('u1', 'r1', { status: 'done' } as never);

      expect(logInstance.status).toBe('done');
      expect(logInstance.save).toHaveBeenCalled();
      expect(routine.currentStreak).toBe(3);
      expect(routine.longestStreak).toBe(3);
      expect(routine.save).toHaveBeenCalled();
      expect(result).toEqual({ routine: { id: 'r1' }, log: { id: 'log-1', status: 'done' } });
    });

    it('resets the streak on a day that breaks the chain', async () => {
      const routine = {
        id: 'r1',
        frequencyType: 'daily',
        frequencyConfig: null,
        startDate: '2026-08-18',
        longestStreak: 5,
        currentStreak: 5,
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ id: 'r1' }),
      };
      (Routine.findOne as jest.Mock).mockResolvedValue(routine);

      const logInstance = {
        status: 'missed',
        value: null as string | null,
        note: null as string | null,
        completedAt: null as Date | null,
        save: jest.fn().mockResolvedValue(undefined),
        toJSON: () => ({ id: 'log-1', status: 'missed' }),
      };
      (HabitLog.findOrCreate as jest.Mock).mockResolvedValue([logInstance, false]);

      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { date: '2026-08-18', status: 'done' },
        { date: '2026-08-19', status: 'done' },
        { date: '2026-08-20', status: 'missed' },
      ]);

      await routinesService.checkIn('u1', 'r1', { status: 'missed' } as never);

      expect(routine.currentStreak).toBe(0);
      expect(routine.longestStreak).toBe(5); // longest streak is never lowered
    });
  });
});
