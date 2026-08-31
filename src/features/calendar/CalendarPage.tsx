import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { fetchCalendarThunk } from './calendar.thunks';
import { selectCalendarMonth, selectCalendarStatus } from './calendar.selectors';
import styles from './calendar.module.scss';
import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarPage() {
  const dispatch = useAppDispatch();
  const month = useAppSelector(selectCalendarMonth);
  const status = useAppSelector(selectCalendarStatus);
  const [connections, setConnections] = useState<{ provider: string; status: string }[]>([]);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCalendarThunk());
  }, [status, dispatch]);
  useEffect(() => {
    void httpClient
      .get('/api/calendar/connections')
      .then(unwrap<{ provider: string; status: string }[]>)
      .then(setConnections)
      .catch(() => undefined);
  }, []);
  const connectGoogle = async () => {
    const result = await httpClient
      .get('/api/calendar/connect/google')
      .then(unwrap<{ url: string | null }>);
    if (result.url) window.location.assign(result.url);
    else setSyncMessage('Google Calendar is not configured yet.');
  };
  const sync = async () => {
    try {
      const result = await httpClient.post('/api/calendar/sync').then(unwrap<{ synced: number }>);
      setSyncMessage(`Synced ${result.synced} calendar connection(s).`);
    } catch {
      setSyncMessage('Calendar sync failed. Please retry.');
    }
  };

  if (!month) return <p>Loading calendar…</p>;

  return (
    <div>
      <div className={styles.card}>
        <h3>Calendar synchronization</h3>
        <p>
          {connections.length
            ? connections.map((c) => `${c.provider} (${c.status})`).join(', ')
            : 'No calendar connected'}
        </p>
        <button type="button" onClick={() => void connectGoogle()}>
          Connect Google Calendar
        </button>
        <button type="button" onClick={() => void sync()}>
          Sync now
        </button>
        {syncMessage && <p role="status">{syncMessage}</p>}
      </div>
      <div className={styles.header}>
        <h2>Calendar</h2>
        <span>{month.label}</span>
      </div>

      <div className={styles.card}>
        <div className={styles.legend}>
          <span className={`${styles.legendItem} ${styles.completed}`}>✓ All done</span>
          <span className={`${styles.legendItem} ${styles.partial}`}>– Partial</span>
          <span className={`${styles.legendItem} ${styles.missed}`}>✕ Missed</span>
          <span className={`${styles.legendItem} ${styles.today}`}>● Today</span>
        </div>

        <div className={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className={styles.grid}>
          {Array.from({ length: month.leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {month.days.map((day) => (
            <div
              key={day.date}
              className={`${styles.day} ${styles[day.status]} ${
                day.date === month.today ? styles.today : ''
              }`}
            >
              <span>{day.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
