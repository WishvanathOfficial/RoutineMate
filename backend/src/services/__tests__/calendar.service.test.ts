jest.mock('../../models', () => ({
  Routine: { findAll: jest.fn() },
  HabitLog: { findAll: jest.fn() },
}));

import { HabitLog, Routine } from '../../models';
import * as calendarService from '../calendar.service';

describe('calendar.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns "none" for every day when the user has no routines', async () => {
    (Routine.findAll as jest.Mock).mockResolvedValue([]);

    const result = await calendarService.getMonthCalendar('u1', '2026-02');

    expect(result.month).toBe('2026-02');
    expect(result.days).toHaveLength(28); // 2026 is not a leap year
    expect(result.days.every((d) => d.status === 'none' && d.total === 0)).toBe(true);
    expect(HabitLog.findAll).not.toHaveBeenCalled();
  });

  it('classifies each day as completed, partial, missed, or none', async () => {
    (Routine.findAll as jest.Mock).mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
    (HabitLog.findAll as jest.Mock).mockResolvedValue([
      { date: '2026-02-01', status: 'done', routineId: 'r1' },
      { date: '2026-02-01', status: 'done', routineId: 'r2' },
      { date: '2026-02-02', status: 'done', routineId: 'r1' },
      { date: '2026-02-02', status: 'missed', routineId: 'r2' },
      { date: '2026-02-03', status: 'missed', routineId: 'r1' },
    ]);

    const result = await calendarService.getMonthCalendar('u1', '2026-02');
    const byDate = new Map(result.days.map((d) => [d.date, d]));

    expect(byDate.get('2026-02-01')).toMatchObject({ status: 'completed', completed: 2, total: 2 });
    expect(byDate.get('2026-02-02')).toMatchObject({ status: 'partial', completed: 1, total: 2 });
    expect(byDate.get('2026-02-03')).toMatchObject({ status: 'missed', completed: 0, total: 1 });
    expect(byDate.get('2026-02-04')).toMatchObject({ status: 'none', completed: 0, total: 0 });
  });

  it("queries habit_logs scoped to the requested month's date range", async () => {
    (Routine.findAll as jest.Mock).mockResolvedValue([{ id: 'r1' }]);
    (HabitLog.findAll as jest.Mock).mockResolvedValue([]);

    await calendarService.getMonthCalendar('u1', '2026-08');

    expect(HabitLog.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ routineId: ['r1'] }),
      }),
    );
  });
});
