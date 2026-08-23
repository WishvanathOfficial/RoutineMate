import { Op } from 'sequelize';
import { HabitLog, Routine } from '../models';

export type DayStatus = 'completed' | 'partial' | 'missed' | 'none';

export interface CalendarDay {
  date: string;
  status: DayStatus;
  completed: number;
  total: number;
}

/**
 * Aggregates habit_logs across every routine a user owns into a per-day
 * status for the given month — design doc §7: "GET /api/calendar?month=YYYY-MM
 * — Aggregate per day across all routines → completed/partial/missed."
 */
export async function getMonthCalendar(userId: string, month: string) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  const daysInMonth = lastDay.getUTCDate();

  const routines = await Routine.findAll({ where: { userId }, attributes: ['id'] });
  const routineIds = routines.map((r) => r.id);

  const days: CalendarDay[] = [];

  if (routineIds.length === 0) {
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push({
        date: `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`,
        status: 'none',
        completed: 0,
        total: 0,
      });
    }
    return { month, days };
  }

  const logs = await HabitLog.findAll({
    where: {
      routineId: routineIds,
      date: {
        [Op.between]: [firstDay.toISOString().slice(0, 10), lastDay.toISOString().slice(0, 10)],
      },
    },
  });

  const byDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const list = byDate.get(log.date) ?? [];
    list.push(log);
    byDate.set(log.date, list);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
    const dayLogs = byDate.get(dateStr) ?? [];
    const completed = dayLogs.filter((l) => l.status === 'done').length;

    let status: DayStatus = 'none';
    if (dayLogs.length > 0) {
      if (completed === dayLogs.length) status = 'completed';
      else if (completed > 0) status = 'partial';
      else status = 'missed';
    }

    days.push({ date: dateStr, status, completed, total: dayLogs.length });
  }

  return { month, days };
}
