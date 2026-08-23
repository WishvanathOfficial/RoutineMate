import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { fetchCalendarThunk } from './calendar.thunks';
import { selectCalendarMonth, selectCalendarStatus } from './calendar.selectors';
import styles from './calendar.module.scss';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function CalendarPage() {
  const dispatch = useAppDispatch();
  const month = useAppSelector(selectCalendarMonth);
  const status = useAppSelector(selectCalendarStatus);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCalendarThunk());
  }, [status, dispatch]);

  if (!month) return <p>Loading calendar…</p>;

  return (
    <div>
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
