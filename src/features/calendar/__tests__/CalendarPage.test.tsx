jest.mock('../calendar.api');

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import * as calendarApi from '../calendar.api';
import calendarReducer from '../calendar.slice';
import CalendarPage from '../CalendarPage';

const month = {
  month: '2026-10',
  label: 'October 2026',
  leadingBlanks: 4,
  today: 26,
  days: [
    { date: 1, status: 'completed' as const, completed: 2, total: 2 },
    { date: 2, status: 'partial' as const, completed: 1, total: 2 },
  ],
};

function renderCalendar() {
  const store = configureStore({ reducer: { calendar: calendarReducer } });
  return render(
    <Provider store={store}>
      <CalendarPage />
    </Provider>,
  );
}

describe('CalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (calendarApi.fetchCalendarMonth as jest.Mock).mockResolvedValue(month);
    (calendarApi.fetchCalendarConnections as jest.Mock).mockResolvedValue([]);
  });

  it('loads the month grid and allows navigating to another month', async () => {
    renderCalendar();

    expect(await screen.findByRole('region', { name: 'October 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thursday, 1 October 2026/ })).toHaveTextContent(
      '2/2',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    await waitFor(() => {
      expect(calendarApi.fetchCalendarMonth).toHaveBeenLastCalledWith('2026-09');
    });
  });

  it('disables sync until a connection is available and shows a selected day summary', async () => {
    renderCalendar();

    const syncButton = await screen.findByRole('button', { name: 'Sync now' });
    expect(syncButton).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Thursday, 1 October 2026/ }));
    expect(screen.getByText('2 of 2 routines completed')).toBeInTheDocument();
  });

  it('shows connected calendars and offers disconnect and sync actions', async () => {
    (calendarApi.fetchCalendarConnections as jest.Mock).mockResolvedValue([
      {
        id: 'google-1',
        provider: 'google',
        status: 'connected',
        expiresAt: null,
      },
    ]);
    (calendarApi.syncCalendars as jest.Mock).mockResolvedValue({ synced: 1, skipped: 0 });

    renderCalendar();

    expect(await screen.findByText('Google Calendar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Synced 1 routine to Google Calendar.',
    );
    expect(calendarApi.syncCalendars).toHaveBeenCalledTimes(1);
  });

  it('offers reconnect when Google authorization expires and prevents sync until reconnecting', async () => {
    (calendarApi.fetchCalendarConnections as jest.Mock).mockResolvedValue([
      {
        id: 'google-1',
        provider: 'google',
        status: 'reauth_required',
        expiresAt: null,
      },
    ]);

    renderCalendar();

    expect(await screen.findByText('Reconnect required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect Google Calendar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeDisabled();
  });
});
