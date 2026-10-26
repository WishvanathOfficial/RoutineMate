import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { fetchCalendarThunk } from './calendar.thunks';
import {
  selectCalendarError,
  selectCalendarMonth,
  selectCalendarStatus,
} from './calendar.selectors';
import {
  disconnectCalendar,
  fetchCalendarConnections,
  requestGoogleCalendarConnection,
  syncCalendars,
} from './calendar.api';
import type { CalendarConnection } from './calendar.types';
import styles from './calendar.module.scss';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function currentMonthParam(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(month: string, day: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CalendarPage() {
  const dispatch = useAppDispatch();
  const month = useAppSelector(selectCalendarMonth);
  const status = useAppSelector(selectCalendarStatus);
  const calendarError = useAppSelector(selectCalendarError);
  const [requestedMonth, setRequestedMonth] = useState(currentMonthParam);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [connectionsStatus, setConnectionsStatus] = useState<'loading' | 'succeeded' | 'failed'>(
    'loading',
  );
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'connect' | 'sync' | string | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadConnections = useCallback(async () => {
    setConnectionsStatus('loading');
    setConnectionsError(null);
    try {
      const result = await fetchCalendarConnections();
      setConnections(result);
      setConnectionsStatus('succeeded');
    } catch {
      setConnectionsError('Unable to load calendar connections. Please try again.');
      setConnectionsStatus('failed');
    }
  }, []);

  useEffect(() => {
    dispatch(fetchCalendarThunk(requestedMonth));
  }, [dispatch, requestedMonth]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const outcome = search.get('calendar');
    if (outcome === 'connected') {
      setSyncMessage('Google Calendar connected.');
      void loadConnections();
    } else if (outcome === 'error') {
      setSyncMessage('Google Calendar could not be connected. Please try again.');
    }
  }, [loadConnections]);

  const googleConnection = connections.find((connection) => connection.provider === 'google');
  const googleConnected = googleConnection?.status === 'connected';

  const handleConnectGoogle = async () => {
    setBusyAction('connect');
    setSyncMessage('');
    try {
      const url = await requestGoogleCalendarConnection();
      if (url) {
        window.location.assign(url);
      } else {
        setSyncMessage('Google Calendar connection is not configured yet.');
      }
    } catch {
      setSyncMessage('Unable to start Google Calendar connection. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSync = async () => {
    if (!googleConnected) return;
    setBusyAction('sync');
    setSyncMessage('');
    try {
      const result = await syncCalendars();
      const syncedLabel = `${result.synced} routine${result.synced === 1 ? '' : 's'}`;
      const skippedLabel = result.skipped
        ? ` ${result.skipped} routine${result.skipped === 1 ? '' : 's'} skipped because they do not have a timed reminder.`
        : '';
      setSyncMessage(`Synced ${syncedLabel} to Google Calendar.${skippedLabel}`);
      await loadConnections();
    } catch {
      setSyncMessage('Calendar sync failed. Please retry.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = async (provider: CalendarConnection['provider']) => {
    setBusyAction(provider);
    setSyncMessage('');
    try {
      await disconnectCalendar(provider);
      setSyncMessage(`${provider === 'google' ? 'Google' : 'Apple'} Calendar disconnected.`);
      await loadConnections();
    } catch {
      setSyncMessage('Unable to disconnect this calendar. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const changeMonth = (offset: number) => {
    setRequestedMonth((current) => shiftMonth(current, offset));
    setSelectedDay(null);
  };

  if (!month && status === 'loading') {
    return (
      <p className={styles.pageState} role="status">
        Loading calendar…
      </p>
    );
  }

  if (!month && status === 'failed') {
    return (
      <div className={styles.pageError} role="alert">
        <p>{calendarError ?? 'Unable to load calendar.'}</p>
        <button type="button" onClick={() => dispatch(fetchCalendarThunk(requestedMonth))}>
          Try again
        </button>
      </div>
    );
  }

  if (!month) return null;

  const selectedDayData = month.days.find((day) => day.date === selectedDay);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2>Calendar</h2>
          <p>Review your routine check-ins and calendar connections.</p>
        </div>
        <div className={styles.monthControls} aria-label="Calendar month navigation">
          <button
            type="button"
            className={styles.monthButton}
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            disabled={status === 'loading'}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className={styles.monthLabel} aria-live="polite">
            {month.label}
          </span>
          <button
            type="button"
            className={styles.monthButton}
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            disabled={status === 'loading'}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      {status === 'failed' && (
        <div className={styles.inlineError} role="alert">
          <span>{calendarError ?? 'Unable to load this month.'}</span>
          <button type="button" onClick={() => dispatch(fetchCalendarThunk(requestedMonth))}>
            Retry
          </button>
        </div>
      )}

      <section className={styles.connectionCard} aria-labelledby="calendar-connections-heading">
        <div className={styles.connectionHeader}>
          <div>
            <h3 id="calendar-connections-heading">Calendar synchronization</h3>
            <p>
              Timed routines sync as 30-minute recurring events. Existing Google Calendar events are
              not changed.
            </p>
          </div>
          <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />
        </div>

        {connectionsStatus === 'loading' ? (
          <p className={styles.connectionState} role="status">
            Loading connections…
          </p>
        ) : connectionsStatus === 'failed' ? (
          <div className={styles.inlineError} role="alert">
            <span>{connectionsError}</span>
            <button type="button" onClick={() => void loadConnections()}>
              Retry
            </button>
          </div>
        ) : connections.length === 0 ? (
          <p className={styles.connectionEmpty}>No calendars connected yet.</p>
        ) : (
          <ul className={styles.connectionList}>
            {connections.map((connection) => (
              <li className={styles.connectionItem} key={connection.id}>
                <div className={styles.connectionProvider}>
                  <i
                    className={
                      connection.provider === 'google'
                        ? 'fa-brands fa-google'
                        : 'fa-brands fa-apple'
                    }
                    aria-hidden="true"
                  />
                  <span>
                    {connection.provider === 'google' ? 'Google Calendar' : 'Apple Calendar'}
                  </span>
                  <span
                    className={
                      connection.status === 'connected'
                        ? styles.connectedBadge
                        : styles.reconnectBadge
                    }
                  >
                    <span className={styles.statusDot} />
                    {connection.status === 'connected' ? 'Connected' : 'Reconnect required'}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.disconnectButton}
                  onClick={() => void handleDisconnect(connection.provider)}
                  disabled={busyAction !== null}
                >
                  {busyAction === connection.provider ? 'Disconnecting…' : 'Disconnect'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.connectionActions}>
          <button
            type="button"
            className={styles.connectButton}
            onClick={() => void handleConnectGoogle()}
            disabled={busyAction !== null || connectionsStatus !== 'succeeded' || googleConnected}
          >
            <i className="fa-brands fa-google" aria-hidden="true" />
            {busyAction === 'connect'
              ? 'Connecting…'
              : googleConnected
                ? 'Google Calendar connected'
                : googleConnection
                  ? 'Reconnect Google Calendar'
                  : 'Connect Google Calendar'}
          </button>
          <button
            type="button"
            className={styles.syncButton}
            onClick={() => void handleSync()}
            disabled={busyAction !== null || !googleConnected}
          >
            <i
              className={`fa-solid ${busyAction === 'sync' ? 'fa-circle-notch fa-spin' : 'fa-rotate'}`}
              aria-hidden="true"
            />
            {busyAction === 'sync' ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {syncMessage && (
          <p className={styles.syncMessage} role="status">
            {syncMessage}
          </p>
        )}
      </section>

      <section className={styles.calendarCard} aria-label={month.label}>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.completed}`}>✓ All done</span>
          <span className={`${styles.legendItem} ${styles.partial}`}>– Partial</span>
          <span className={`${styles.legendItem} ${styles.missed}`}>✕ Missed</span>
          <span className={`${styles.legendItem} ${styles.today}`}>● Today</span>
        </div>

        <div className={styles.weekdayRow} aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className={`${styles.grid} ${status === 'loading' ? styles.gridLoading : ''}`}>
          {Array.from({ length: month.leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} aria-hidden="true" />
          ))}
          {month.days.map((day) => (
            <button
              type="button"
              key={day.date}
              className={`${styles.day} ${styles[day.status]} ${
                day.date === month.today ? styles.today : ''
              } ${selectedDay === day.date ? styles.selectedDay : ''}`}
              aria-label={`${formatDate(month.month, day.date)}: ${day.completed} of ${day.total} routines completed`}
              aria-pressed={selectedDay === day.date}
              onClick={() => setSelectedDay((current) => (current === day.date ? null : day.date))}
            >
              <span>{day.date}</span>
              {day.total > 0 && (
                <span className={styles.dayCount}>
                  {day.completed}/{day.total}
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedDayData && (
          <div className={styles.dayDetail} role="status">
            <strong>{formatDate(month.month, selectedDayData.date)}</strong>
            {selectedDayData.total === 0 ? (
              <span>No routine check-ins recorded.</span>
            ) : (
              <span>
                {selectedDayData.completed} of {selectedDayData.total} routines completed
                {selectedDayData.total > selectedDayData.completed
                  ? ` · ${selectedDayData.total - selectedDayData.completed} incomplete`
                  : ''}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
