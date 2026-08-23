import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import { currentMonthParam, toCalendarMonth, type BackendCalendarMonth } from './calendar.mapper';
import type { CalendarMonth } from './calendar.types';

// Real backend call — see docs/RoutineMate-Frontend-Backend-Integration-Plan.md
// §2.5 "Calendar". `month` defaults to the current month since CalendarPage
// has no month-navigation UI yet (a documented, contained follow-up).
export async function fetchCalendarMonth(month?: string): Promise<CalendarMonth> {
  const targetMonth = month ?? currentMonthParam();
  const dto = await httpClient
    .get('/api/calendar', { params: { month: targetMonth } })
    .then(unwrap<BackendCalendarMonth>);
  return toCalendarMonth(dto);
}
