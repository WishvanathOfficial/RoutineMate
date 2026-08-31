import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { MOOD_OPTIONS, moodEmoji } from './journal.types';
import {
  selectAllJournalEntries,
  selectJournalStatus,
  selectTodayJournalEntry,
} from './journal.selectors';
import { createJournalEntryThunk, fetchJournalEntriesThunk } from './journal.thunks';
import styles from './journal.module.scss';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function localDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A 6-week (42-day) grid starting on the Sunday on/before the 1st of the
 * month, so the calendar always renders full weeks — including a few
 * trailing days from the previous month and leading days from the next. */
function buildMonthGrid(monthAnchor: Date): Date[] {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

// docs/RoutineMate-MVP2-Scope.md §3.3 "New Journal page with a
// calendar-style entry list" — a month grid of days, each showing that
// day's mood emoji if one was logged, clicking through to /journal/:date
// (see JournalEntryPage.tsx) for the full reflection.
export default function JournalPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const entries = useAppSelector(selectAllJournalEntries);
  const status = useAppSelector(selectJournalStatus);
  const todayEntry = useAppSelector(selectTodayJournalEntry);

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  useEffect(() => {
    if (status === 'idle') dispatch(fetchJournalEntriesThunk());
  }, [status, dispatch]);

  // Pre-fill the form once today's entry loads, so re-opening the page shows
  // what was already logged instead of a blank draft.
  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood);
      setNote(todayEntry.note);
    }
  }, [todayEntry]);

  const handleSave = async () => {
    if (!note.trim()) {
      dispatch(toastShown('Write a quick reflection before saving.'));
      return;
    }
    setSaving(true);
    const result = await dispatch(createJournalEntryThunk({ mood, note: note.trim() }));
    setSaving(false);
    if (createJournalEntryThunk.fulfilled.match(result)) {
      dispatch(toastShown('Journal entry saved 📝'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save journal entry.'));
    }
  };

  const entryByDate = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry])),
    [entries],
  );
  const monthGrid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const todayStr = localDateStr(new Date());
  const monthLabel = monthAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToMonth = (offset: number) => {
    setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Journal</h2>
        <p>A short daily reflection, separate from your habit check-ins.</p>
      </div>

      <div className={styles.composeCard}>
        <p className={styles.composeLabel}>How did today go?</p>
        <div className={styles.moodPicker}>
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.moodButton} ${mood === option.value ? styles.moodButtonSelected : ''}`}
              onClick={() => setMood(option.value)}
              aria-label={option.label}
              aria-pressed={mood === option.value}
            >
              {option.emoji}
            </button>
          ))}
        </div>
        <textarea
          className={styles.noteInput}
          rows={3}
          placeholder="Write a quick reflection..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {todayEntry ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>

      {status === 'loading' && entries.length === 0 ? (
        <p className={styles.emptyState}>Loading entries…</p>
      ) : (
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <h3>{monthLabel}</h3>
            <button
              type="button"
              className={styles.calendarNavButton}
              onClick={() => goToMonth(1)}
              aria-label="Next month"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div className={styles.calendarWeekdays}>
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className={styles.calendarGrid}>
            {monthGrid.map((day) => {
              const dateStr = localDateStr(day);
              const inMonth = day.getMonth() === monthAnchor.getMonth();
              const entry = entryByDate.get(dateStr);
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={`${styles.calendarDay} ${inMonth ? '' : styles.calendarDayOutside} ${isToday ? styles.calendarDayToday : ''}`}
                  onClick={() => navigate(`/journal/${dateStr}`)}
                >
                  <span className={styles.calendarDayNumber}>{day.getDate()}</span>
                  {entry && <span className={styles.calendarDayMood}>{moodEmoji(entry.mood)}</span>}
                </button>
              );
            })}
          </div>

          {entries.length === 0 && (
            <p className={styles.emptyState}>
              No entries yet — write your first reflection above, or click any day to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
