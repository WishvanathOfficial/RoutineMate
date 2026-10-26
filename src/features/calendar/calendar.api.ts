import { unwrap } from '@api/apiResponse';
import { httpClient } from '@api/httpClient';
import { currentMonthParam, toCalendarMonth, type BackendCalendarMonth } from './calendar.mapper';
import type { CalendarConnection, CalendarMonth } from './calendar.types';

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

export async function fetchCalendarConnections(): Promise<CalendarConnection[]> {
  return httpClient.get('/api/calendar/connections').then(unwrap<CalendarConnection[]>);
}

export async function requestGoogleCalendarConnection(): Promise<string | null> {
  const result = await httpClient
    .get('/api/calendar/connect/google', {
      params: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    })
    .then(unwrap<{ url: string | null }>);
  return result.url;
}

export async function disconnectCalendar(provider: CalendarConnection['provider']): Promise<void> {
  await httpClient.post('/api/calendar/disconnect', { provider });
}

export async function syncCalendars(): Promise<{ synced: number; skipped: number }> {
  return httpClient.post('/api/calendar/sync').then(unwrap<{ synced: number; skipped: number }>);
}
