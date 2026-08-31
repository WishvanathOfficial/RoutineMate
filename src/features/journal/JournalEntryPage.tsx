import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { MOOD_OPTIONS } from './journal.types';
import { selectJournalEntryByDate } from './journal.selectors';
import { fetchJournalEntryByDateThunk, saveJournalEntryForDateThunk } from './journal.thunks';
import styles from './journal.module.scss';

function formatFullDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isValidDateParam(date: string | undefined): date is string {
  return !!date && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// docs/RoutineMate-MVP2-Scope.md §4 site map: "/journal/:date — Single day
// entry". Lets you view — and, since a bare view of a day you never logged
// wouldn't be very useful, also add or edit — the reflection for one
// specific day, reached by clicking a day on JournalPage's calendar.
export default function JournalEntryPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const entry = useAppSelector(selectJournalEntryByDate(date ?? ''));

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isValidDateParam(date)) return;
    setLoading(true);
    dispatch(fetchJournalEntryByDateThunk(date)).finally(() => setLoading(false));
  }, [date, dispatch]);

  useEffect(() => {
    if (entry) {
      setMood(entry.mood);
      setNote(entry.note);
    }
  }, [entry]);

  if (!isValidDateParam(date)) {
    return (
      <div>
        <button type="button" className={styles.backLink} onClick={() => navigate('/journal')}>
          ← Back to Journal
        </button>
        <p className={styles.emptyState}>That doesn&apos;t look like a valid date.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!note.trim()) {
      dispatch(toastShown('Write a quick reflection before saving.'));
      return;
    }
    setSaving(true);
    const result = await dispatch(
      saveJournalEntryForDateThunk({ date, input: { mood, note: note.trim() } }),
    );
    setSaving(false);
    if (saveJournalEntryForDateThunk.fulfilled.match(result)) {
      dispatch(toastShown('Journal entry saved 📝'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save journal entry.'));
    }
  };

  return (
    <div>
      <button type="button" className={styles.backLink} onClick={() => navigate('/journal')}>
        ← Back to Journal
      </button>
      <div className={styles.pageHeader}>
        <h2>{formatFullDate(date)}</h2>
        <p>{entry ? "Edit this day's reflection." : 'No entry logged for this day yet.'}</p>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Loading…</p>
      ) : (
        <div className={styles.composeCard}>
          <p className={styles.composeLabel}>How did this day go?</p>
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
            rows={4}
            placeholder="Write a quick reflection..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {entry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      )}
    </div>
  );
}
