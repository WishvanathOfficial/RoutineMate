jest.mock('../../services/notificationGenerator.service', () => ({
  runNotificationSweep: jest.fn().mockResolvedValue({
    reminders: 0,
    streakRisks: 0,
    digests: 0,
    nudges: 0,
    errors: [],
  }),
}));

jest.mock('../../services/weeklyEmail.service', () => ({
  runWeeklyEmailSweep: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { runNotificationSweep } from '../../services/notificationGenerator.service';
import { runWeeklyEmailSweep } from '../../services/weeklyEmail.service';
import { startNotificationScheduler, stopNotificationScheduler } from '../notificationScheduler';

const mockRunNotificationSweep = runNotificationSweep as jest.Mock;
const mockRunWeeklyEmailSweep = runWeeklyEmailSweep as jest.Mock;

describe('notificationScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunNotificationSweep.mockResolvedValue({
      reminders: 0,
      streakRisks: 0,
      digests: 0,
      nudges: 0,
      errors: [],
    });
    mockRunWeeklyEmailSweep.mockResolvedValue(0);
    jest.useFakeTimers();
  });

  afterEach(() => {
    stopNotificationScheduler();
    jest.useRealTimers();
  });

  it('calls runNotificationSweep after the interval elapses', async () => {
    startNotificationScheduler();

    expect(mockRunNotificationSweep).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockRunNotificationSweep).toHaveBeenCalledTimes(1);
  });

  it('also calls runWeeklyEmailSweep on every tick', async () => {
    startNotificationScheduler();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockRunWeeklyEmailSweep).toHaveBeenCalledTimes(1);
  });

  it('still runs the weekly email sweep even if the notification sweep rejects', async () => {
    mockRunNotificationSweep.mockRejectedValue(new Error('boom'));
    startNotificationScheduler();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockRunWeeklyEmailSweep).toHaveBeenCalledTimes(1);
  });

  it('does not double-schedule when called twice', async () => {
    startNotificationScheduler();
    startNotificationScheduler();

    await jest.advanceTimersByTimeAsync(60_000);

    expect(mockRunNotificationSweep).toHaveBeenCalledTimes(1);
  });

  it('stops further calls once stopped', async () => {
    startNotificationScheduler();

    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockRunNotificationSweep).toHaveBeenCalledTimes(1);

    stopNotificationScheduler();

    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockRunNotificationSweep).toHaveBeenCalledTimes(1);
  });
});
