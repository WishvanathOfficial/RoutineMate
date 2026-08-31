jest.mock('../../models', () => ({
  User: { findAll: jest.fn() },
  UserPreferences: { findAll: jest.fn() },
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
}));

jest.mock('../routines.service', () => ({
  isExpectedDay: jest.fn(),
}));

jest.mock('../mail.service', () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { HabitLog, Routine, User, UserPreferences } from '../../models';
import { isExpectedDay } from '../routines.service';
import { sendMail } from '../mail.service';
import { runWeeklyEmailSweep } from '../weeklyEmail.service';

const mockIsExpectedDay = isExpectedDay as jest.Mock;
const mockSendMail = sendMail as jest.Mock;

const NINE_AM = new Date('2026-08-24T09:00:00');

function makePref(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'u1',
    weeklyEmailEnabled: true,
    weeklyEmailLastSentAt: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', ...overrides };
}

function makeRoutine(overrides: Record<string, unknown> = {}) {
  return { id: 'r1', userId: 'u1', status: 'active', longestStreak: 10, ...overrides };
}

describe('weeklyEmail.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (User.findAll as jest.Mock).mockResolvedValue([]);
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([]);
    (Routine.findAll as jest.Mock).mockResolvedValue([]);
    (HabitLog.findAll as jest.Mock).mockResolvedValue([]);
    mockIsExpectedDay.mockReturnValue(true);
    mockSendMail.mockResolvedValue(undefined);
  });

  it('is a no-op before the daily send time', async () => {
    const beforeNine = new Date('2026-08-24T08:59:00');

    const sent = await runWeeklyEmailSweep(beforeNine);

    expect(sent).toBe(0);
    expect(UserPreferences.findAll).not.toHaveBeenCalled();
  });

  it('catches up after the send time when the scheduler missed 09:00', async () => {
    const pref = makePref();
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([pref]);
    (User.findAll as jest.Mock).mockResolvedValue([makeUser()]);

    const sent = await runWeeklyEmailSweep(new Date('2026-08-24T09:01:00'));

    expect(sent).toBe(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.com' }));
  });

  it('is a no-op when nobody has opted in', async () => {
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([]);

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(0);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('skips a user whose last email was sent under 7 days ago', async () => {
    const recentlySent = new Date(NINE_AM.getTime() - 3 * 24 * 60 * 60 * 1000);
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([
      makePref({ weeklyEmailLastSentAt: recentlySent }),
    ]);

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(0);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends and persists weeklyEmailLastSentAt for a user who has never received one', async () => {
    const pref = makePref({ weeklyEmailLastSentAt: null });
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([pref]);
    (User.findAll as jest.Mock).mockResolvedValue([makeUser()]);
    (Routine.findAll as jest.Mock).mockResolvedValue([makeRoutine()]);
    (HabitLog.findAll as jest.Mock).mockResolvedValue([
      { routineId: 'r1', status: 'done' },
      { routineId: 'r1', status: 'done' },
    ]);

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ada@example.com',
        subject: expect.stringContaining('weekly'),
      }),
    );
    expect(pref.save).toHaveBeenCalled();
    expect(pref.weeklyEmailLastSentAt).toBe(NINE_AM);
  });

  it('sends again for a user whose last email was more than 7 days ago', async () => {
    const longAgo = new Date(NINE_AM.getTime() - 8 * 24 * 60 * 60 * 1000);
    const pref = makePref({ weeklyEmailLastSentAt: longAgo });
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([pref]);
    (User.findAll as jest.Mock).mockResolvedValue([makeUser()]);
    (Routine.findAll as jest.Mock).mockResolvedValue([makeRoutine()]);

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('isolates a per-user failure so other users still receive their email', async () => {
    const prefA = makePref({ userId: 'uA' });
    const prefB = makePref({ userId: 'uB' });
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([prefA, prefB]);
    (User.findAll as jest.Mock).mockResolvedValue([
      makeUser({ id: 'uA', email: 'a@example.com' }),
      makeUser({ id: 'uB', email: 'b@example.com' }),
    ]);
    (Routine.findAll as jest.Mock).mockImplementation(
      ({ where }: { where: { userId: string } }) => {
        if (where.userId === 'uA') return Promise.reject(new Error('db boom'));
        return Promise.resolve([makeRoutine({ userId: 'uB' })]);
      },
    );

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'b@example.com' }));
    expect(prefA.save).not.toHaveBeenCalled();
    expect(prefB.save).toHaveBeenCalled();
  });

  it('skips a preferences row with no matching user', async () => {
    (UserPreferences.findAll as jest.Mock).mockResolvedValue([makePref({ userId: 'ghost' })]);
    (User.findAll as jest.Mock).mockResolvedValue([]);

    const sent = await runWeeklyEmailSweep(NINE_AM);

    expect(sent).toBe(0);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
