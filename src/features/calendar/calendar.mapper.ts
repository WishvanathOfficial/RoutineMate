// Translates the backend's raw per-day aggregation into the grid-ready shape
// CalendarPage.tsx renders — see
// docs/RoutineMate-Frontend-Backend-Integration-Plan.md §2.5 "Calendar".
import type { CalendarDay, CalendarDayStatus, CalendarMonth } from './calendar.types';

export interface BackendCalendarDay {
  date: string; // 'YYYY-MM-DD'
  status: CalendarDayStatus;
  completed: number;
  total: number;
}

export interface BackendCalendarMonth {
  month: string; // 'YYYY-MM'
  days: BackendCalendarDay[];
}

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Defaults GET /api/calendar's required ?month= to the real current month. */
export function currentMonthParam(): string {
  return currentMonthIso();
}

export function toCalendarMonth(dto: BackendCalendarMonth): CalendarMonth {
  const [yearStr, monthStr] = dto.month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  // Constructed from Y/M/D components (not parsed from an ISO string) so the
  // weekday/label calculations use local time and can't drift a day from a
  // UTC-midnight interpretation in negative-UTC-offset timezones.
  const firstOfMonth = new Date(year, monthIndex, 1);
  const leadingBlanks = firstOfMonth.getDay(); // 0 = Sunday, matches CalendarPage's WEEKDAYS order
  const label = firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Only highlight "today" when the requested month actually is the current
  // month — 0 is a safe sentinel since day-of-month is always >= 1.
  const isCurrentMonth = dto.month === currentMonthIso();
  const today = isCurrentMonth ? new Date().getDate() : 0;

  const days: CalendarDay[] = dto.days.map((day) => ({
    date: Number(day.date.slice(8, 10)),
    status: day.status,
  }));

  return { label, leadingBlanks, today, days };
}
