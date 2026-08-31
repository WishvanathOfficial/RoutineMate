jest.mock('../../models', () => ({
  Notification: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    create: jest.fn(),
  },
  User: { findAll: jest.fn() },
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
  UserPreferences: { findAll: jest.fn() },
}));

jest.mock('../routines.service', () => ({
  isExpectedDay: jest.fn(),
}));

jest.mock('../mail.service', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

import { HabitLog, Notification, Routine, User, UserPreferences } from '../../models';
import { sendMail } from '../mail.service';
import { isExpectedDay } from '../routines.service';
import {
  generateDailyDigestNotifications,
  generateReminderNotifications,
  generateSmartNudgeNotifications,
  generateStreakRiskNotifications,
  runNotificationSweep,
} from '../notificationGenerator.service';

const mockIsExpectedDay = isExpectedDay as jest.Mock;
const mockSendMail = sendMail as jest.Mock;

function makeRoutine(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    userId: 'u1',
    name: 'Morning Run',
    emoji: '🏃',
    status: 'active',
    reminderType: 'time',
    reminderTime: '08:00:00',
    currentStreak: 5,
    frequencyType: 'daily',
    frequencyConfig: null,
    ...overrides,
  };
}

describe('notificationGenerator.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Routine.findAll as jest.Mock).mockResolvedValue([]);
    (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
    (Notification.findAll as jest.Mock).mockResolvedValue([]);
    (Notification.bulkCreate as jest.Mock).mockResolvedValue([]);
    (Notification.create as jest.Mock).mockResolvedValue({});
    (User.findAll as jest.Mock).mockResolvedValue([]);
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([]);
    mockSendMail.mockResolvedValue(undefined);
    mockIsExpectedDay.mockReturnValue(true);
  });

  describe('generateReminderNotifications', () => {
    it('fires when the routine reminderTime matches current local HH:MM and all conditions pass', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(1);
      expect(Notification.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'u1',
          type: 'reminder',
          routineId: 'r1',
          message: 'Time for "Morning Run" 🏃!',
        }),
      ]);
    });

    it('skips when reminderTime does not match current local HH:MM', async () => {
      const now = new Date('2026-08-24T08:01:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when isExpectedDay returns false', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      mockIsExpectedDay.mockReturnValue(false);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when the routine is already checked in as done today', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1', status: 'done' }]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when the user has disabled push reminders', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: false },
      ]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when a reminder notification already exists for the routine today (dedupe)', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (Notification.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1' }]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('reminds a user with no preferences row (default-enabled)', async () => {
      const now = new Date('2026-08-24T08:00:00');
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([]);

      const count = await generateReminderNotifications(now);

      expect(count).toBe(1);
      expect(Notification.bulkCreate).toHaveBeenCalled();
    });
  });

  describe('generateStreakRiskNotifications', () => {
    it('is a no-op before hour 18 local', async () => {
      const now = new Date('2026-08-24T17:59:00');
      (Routine.findAll as jest.Mock).mockResolvedValue([makeRoutine({ currentStreak: 5 })]);

      const count = await generateStreakRiskNotifications(now);

      expect(count).toBe(0);
      expect(Routine.findAll).not.toHaveBeenCalled();
    });

    it('is active from hour 18 onward', async () => {
      const now = new Date('2026-08-24T18:00:00');
      const routine = makeRoutine({ currentStreak: 5 });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateStreakRiskNotifications(now);

      expect(count).toBe(1);
      expect(Notification.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'u1',
          type: 'streak_risk',
          routineId: 'r1',
        }),
      ]);
    });

    it('only queries for routines with currentStreak >= 3 via the where clause', async () => {
      const now = new Date('2026-08-24T19:00:00');
      (Routine.findAll as jest.Mock).mockResolvedValue([]);

      await generateStreakRiskNotifications(now);

      expect(Routine.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            currentStreak: expect.anything(),
          }),
        }),
      );
    });

    it('skips when already done today', async () => {
      const now = new Date('2026-08-24T19:00:00');
      const routine = makeRoutine({ currentStreak: 5 });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1', status: 'done' }]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateStreakRiskNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when already warned today (dedupe)', async () => {
      const now = new Date('2026-08-24T19:00:00');
      const routine = makeRoutine({ currentStreak: 5 });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (Notification.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1' }]);
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', pushRemindersEnabled: true },
      ]);

      const count = await generateStreakRiskNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('generateDailyDigestNotifications', () => {
    it('does not fire before local time 20:00', async () => {
      const now = new Date('2026-08-24T19:59:00');

      const count = await generateDailyDigestNotifications(now);

      expect(count).toBe(0);
      expect(UserPreferences.findAll).not.toHaveBeenCalled();
    });

    it('catches up after 20:00 when the scheduler missed the exact minute', async () => {
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', dailyDigestEnabled: true },
      ]);
      (Routine.findAll as jest.Mock).mockResolvedValue([makeRoutine()]);
      (User.findAll as jest.Mock).mockResolvedValue([
        { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
      ]);

      const count = await generateDailyDigestNotifications(new Date('2026-08-24T20:01:00'));

      expect(count).toBe(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.com' }));
    });

    it('only fires for users with dailyDigestEnabled true, and computes completed/expected counts correctly', async () => {
      const now = new Date('2026-08-24T20:00:00');
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', dailyDigestEnabled: true },
      ]);

      const routines = [makeRoutine({ id: 'r1' }), makeRoutine({ id: 'r2' })];
      (Routine.findAll as jest.Mock).mockResolvedValue(routines);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1', status: 'done' }]);
      (User.findAll as jest.Mock).mockResolvedValue([
        { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
      ]);

      const count = await generateDailyDigestNotifications(now);

      expect(UserPreferences.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { dailyDigestEnabled: true } }),
      );
      expect(count).toBe(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ada@example.com',
          subject: 'Your RoutineMate daily digest',
          text: expect.stringContaining('1 of 2'),
        }),
      );
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: 'digest',
          routineId: null,
          message: expect.stringContaining('1 of 2'),
        }),
      );
    });

    it('skips if a digest already exists today for that user (dedupe)', async () => {
      const now = new Date('2026-08-24T20:00:00');
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', dailyDigestEnabled: true },
      ]);
      (User.findAll as jest.Mock).mockResolvedValue([
        { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
      ]);
      (Notification.findAll as jest.Mock).mockResolvedValue([{ userId: 'u1' }]);

      const count = await generateDailyDigestNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips a user with zero routines expected today', async () => {
      const now = new Date('2026-08-24T20:00:00');
      (UserPreferences.findAll as jest.Mock).mockResolvedValue([
        { userId: 'u1', dailyDigestEnabled: true },
      ]);
      (Routine.findAll as jest.Mock).mockResolvedValue([makeRoutine({ id: 'r1' })]);
      mockIsExpectedDay.mockReturnValue(false);

      const count = await generateDailyDigestNotifications(now);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('generateSmartNudgeNotifications', () => {
    const NINE_AM = new Date('2026-08-24T09:00:00');

    it('is a no-op when the local time is not the fixed check time', async () => {
      const notNine = new Date('2026-08-24T09:01:00');

      const count = await generateSmartNudgeNotifications(notNine);

      expect(count).toBe(0);
      expect(Routine.findAll).not.toHaveBeenCalled();
    });

    it('fires when most recent completions land consistently late', async () => {
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', completedAt: new Date('2026-08-18T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-19T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-20T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-21T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-22T09:00:00') },
      ]);

      const count = await generateSmartNudgeNotifications(NINE_AM);

      expect(count).toBe(1);
      expect(Notification.bulkCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: 'u1',
          type: 'nudge',
          routineId: 'r1',
          message: expect.stringContaining('09:00'),
        }),
      ]);
    });

    it('skips when fewer than the minimum number of samples exist', async () => {
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', completedAt: new Date('2026-08-20T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-21T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-22T09:00:00') },
      ]);

      const count = await generateSmartNudgeNotifications(NINE_AM);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips when late check-ins are not consistent enough (below the late ratio)', async () => {
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', completedAt: new Date('2026-08-18T09:00:00') }, // late
        { routineId: 'r1', completedAt: new Date('2026-08-19T09:00:00') }, // late
        { routineId: 'r1', completedAt: new Date('2026-08-20T08:00:00') }, // on time
        { routineId: 'r1', completedAt: new Date('2026-08-21T08:00:00') }, // on time
        { routineId: 'r1', completedAt: new Date('2026-08-22T08:00:00') }, // on time
      ]);

      const count = await generateSmartNudgeNotifications(NINE_AM);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });

    it('skips a routine already nudged within the cooldown window (dedupe)', async () => {
      const routine = makeRoutine({ reminderTime: '08:00:00' });
      (Routine.findAll as jest.Mock).mockResolvedValue([routine]);
      (HabitLog.findAll as jest.Mock).mockResolvedValue([
        { routineId: 'r1', completedAt: new Date('2026-08-18T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-19T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-20T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-21T09:00:00') },
        { routineId: 'r1', completedAt: new Date('2026-08-22T09:00:00') },
      ]);
      (Notification.findAll as jest.Mock).mockResolvedValue([{ routineId: 'r1' }]);

      const count = await generateSmartNudgeNotifications(NINE_AM);

      expect(count).toBe(0);
      expect(Notification.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('runNotificationSweep', () => {
    it('sums all three generators counts into a single result', async () => {
      const now = new Date('2026-08-24T20:00:00');

      // Reminder: matching routine
      const reminderRoutine = makeRoutine({
        id: 'rReminder',
        reminderTime: '20:00:00',
        currentStreak: 0,
      });
      // Streak risk: separate routine with high streak (hour 20 >= 18, so active)
      const streakRoutine = makeRoutine({
        id: 'rStreak',
        reminderType: 'location',
        reminderTime: null,
        currentStreak: 5,
      });

      (Routine.findAll as jest.Mock).mockImplementation(({ where }: any) => {
        if (where.reminderType === 'time') return Promise.resolve([reminderRoutine]);
        if (where.currentStreak) return Promise.resolve([streakRoutine]);
        return Promise.resolve([]);
      });
      (UserPreferences.findAll as jest.Mock).mockImplementation(({ where }: any) => {
        if (where.dailyDigestEnabled) {
          return Promise.resolve([{ userId: 'u1', dailyDigestEnabled: true }]);
        }
        return Promise.resolve([{ userId: 'u1', pushRemindersEnabled: true }]);
      });
      (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
      (Notification.findAll as jest.Mock).mockResolvedValue([]);

      const result = await runNotificationSweep(now);

      expect(result.reminders).toBe(1);
      expect(result.streakRisks).toBe(1);
      // Digest opt-in user has no active routines matched by this test's
      // Routine.findAll mock (only the reminder/streak where-clauses are
      // stubbed with data), so expected=0 and the digest is correctly skipped.
      expect(result.digests).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('isolates a failure in one generator so the other two still run and complete', async () => {
      const now = new Date('2026-08-24T20:00:00');

      const streakRoutine = makeRoutine({
        id: 'rStreak',
        reminderType: 'location',
        reminderTime: null,
        currentStreak: 5,
      });

      (Routine.findAll as jest.Mock).mockImplementation(({ where }: any) => {
        if (where.reminderType === 'time') {
          return Promise.reject(new Error('reminder query boom'));
        }
        if (where.currentStreak) return Promise.resolve([streakRoutine]);
        return Promise.resolve([]);
      });
      (UserPreferences.findAll as jest.Mock).mockImplementation(({ where }: any) => {
        if (where.dailyDigestEnabled) {
          return Promise.resolve([{ userId: 'u1', dailyDigestEnabled: true }]);
        }
        return Promise.resolve([{ userId: 'u1', pushRemindersEnabled: true }]);
      });
      (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
      (Notification.findAll as jest.Mock).mockResolvedValue([]);

      const result = await runNotificationSweep(now);

      expect(result.reminders).toBe(0);
      expect(result.streakRisks).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('reminders: reminder query boom')]),
      );
    });
  });
});
