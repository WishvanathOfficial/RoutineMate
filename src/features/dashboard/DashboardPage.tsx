import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectCurrentUser } from '@features/auth/auth.selectors';
import {
  selectActiveRoutines,
  selectBestStreak,
  selectRoutinesStatus,
  selectTodayProgress,
} from '@features/routines/routines.selectors';
import {
  createRoutineThunk,
  fetchRoutinesThunk,
  toggleCheckInThunk,
} from '@features/routines/routines.thunks';
import RoutineFormModal from '@features/routines/components/RoutineFormModal';
import type { CreateRoutineInput, Routine } from '@features/routines/routines.types';
import { toastShown } from '@features/ui/ui.slice';
import { selectFeaturedGoal, selectGoalsStatus } from '@features/goals/goals.selectors';
import { fetchGoalsThunk } from '@features/goals/goals.thunks';
import goalsStyles from '@features/goals/goals.module.scss';
import {
  selectAchievementsStatus,
  selectMostRecentAchievement,
  selectUserXp,
} from '@features/achievements/achievements.selectors';
import {
  fetchAchievementsThunk,
  refreshAchievementsAfterActivity,
} from '@features/achievements/achievements.thunks';
import { formatUnlockedDate } from '@features/achievements/achievements.types';
import { MOOD_OPTIONS } from '@features/journal/journal.types';
import { selectJournalStatus, selectTodayJournalEntry } from '@features/journal/journal.selectors';
import {
  createJournalEntryThunk,
  fetchJournalEntriesThunk,
} from '@features/journal/journal.thunks';
import journalStyles from '@features/journal/journal.module.scss';
import ProgressRing from '@components/ProgressRing/ProgressRing';
import { fetchGreetingThunk } from './dashboard.thunks';
import { selectGreeting } from './dashboard.selectors';
import styles from './dashboard.module.scss';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const greeting = useAppSelector(selectGreeting);
  const routines = useAppSelector(selectActiveRoutines);
  const progress = useAppSelector(selectTodayProgress);
  const bestStreak = useAppSelector(selectBestStreak);
  const routinesStatus = useAppSelector(selectRoutinesStatus);
  const featuredGoal = useAppSelector(selectFeaturedGoal);
  const goalsStatus = useAppSelector(selectGoalsStatus);
  const recentAchievement = useAppSelector(selectMostRecentAchievement);
  const xp = useAppSelector(selectUserXp);
  const achievementsStatus = useAppSelector(selectAchievementsStatus);
  const todayJournalEntry = useAppSelector(selectTodayJournalEntry);
  const journalStatus = useAppSelector(selectJournalStatus);
  const [isModalOpen, setModalOpen] = useState(false);
  const [journalMood, setJournalMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [journalNote, setJournalNote] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);

  useEffect(() => {
    if (routinesStatus === 'idle') dispatch(fetchRoutinesThunk());
  }, [routinesStatus, dispatch]);

  useEffect(() => {
    if (goalsStatus === 'idle') dispatch(fetchGoalsThunk());
  }, [goalsStatus, dispatch]);

  useEffect(() => {
    if (achievementsStatus === 'idle') dispatch(fetchAchievementsThunk());
  }, [achievementsStatus, dispatch]);

  useEffect(() => {
    if (journalStatus === 'idle') dispatch(fetchJournalEntriesThunk());
  }, [journalStatus, dispatch]);

  // docs/RoutineMate-MVP2-Scope.md §3.3 "a quick-add box on the Dashboard" —
  // pre-fill from today's entry (if any) so re-opening the dashboard shows
  // what was already logged, same as the Journal page itself.
  useEffect(() => {
    if (todayJournalEntry) {
      setJournalMood(todayJournalEntry.mood);
      setJournalNote(todayJournalEntry.note);
    }
  }, [todayJournalEntry]);

  const handleSaveJournal = async () => {
    if (!journalNote.trim()) {
      dispatch(toastShown('Write a quick reflection before saving.'));
      return;
    }
    setJournalSaving(true);
    const result = await dispatch(
      createJournalEntryThunk({ mood: journalMood, note: journalNote.trim() }),
    );
    setJournalSaving(false);
    if (createJournalEntryThunk.fulfilled.match(result)) {
      dispatch(toastShown('Journal entry saved 📝'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to save journal entry.'));
    }
  };

  useEffect(() => {
    dispatch(fetchGreetingThunk(user?.name.split(' ')[0] ?? 'there'));
  }, [dispatch, user]);

  const handleToggle = async (routine: Routine) => {
    const result = await dispatch(toggleCheckInThunk({ routine }));
    if (toggleCheckInThunk.fulfilled.match(result)) {
      // Checking in (not un-checking) is the only direction that can ever
      // unlock a badge — see achievements.service.ts's rule engine.
      if (!routine.completedToday) dispatch(refreshAchievementsAfterActivity());
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to update check-in.'));
    }
  };

  const handleCreateRoutine = async (input: CreateRoutineInput) => {
    const result = await dispatch(createRoutineThunk(input));
    if (createRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine created 🎉'));
      dispatch(refreshAchievementsAfterActivity()); // may unlock 'First Habit Created'
      setModalOpen(false);
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to create routine.'));
    }
  };

  return (
    <div>
      <div className={styles.header}>
        {/* Backend returns the user's full name; always show just the first word. */}
        <h2>Good morning, {(greeting?.name ?? user?.name)?.split(' ')[0] ?? 'there'} 👋</h2>
        <p>{greeting?.quote ?? 'Small steps every day lead to big change.'}</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.listHeader}>
            <h3>Today&apos;s Routines</h3>
            <Link to="/routines">View all →</Link>
          </div>
          <div className={styles.habitList}>
            {routines.map((routine) => (
              <div className={styles.habitItem} key={routine.id}>
                <div className={styles.habitInfo}>
                  <button
                    type="button"
                    className={`${styles.checkButton} ${routine.completedToday ? styles.completed : ''}`}
                    onClick={() => handleToggle(routine)}
                    aria-label={`Toggle ${routine.name}`}
                  >
                    <i className="fa-solid fa-check" aria-hidden="true" />
                  </button>
                  <div>
                    <p style={{ fontWeight: 500 }}>
                      {routine.emoji} {routine.name}
                    </p>
                    <p style={{ fontSize: 12 }} className={styles.metaText}>
                      {routine.reminderTime} · {routine.frequency}
                    </p>
                  </div>
                </div>
                <span className={styles.streakBadge}>
                  <i className="fa-solid fa-fire" aria-hidden="true" /> {routine.streak}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.progressCard}>
          <h3 style={{ alignSelf: 'flex-start', marginBottom: 16 }}>Today&apos;s Progress</h3>
          <ProgressRing percentage={progress.percentage} />
          <p className={styles.metaText} style={{ fontSize: 14, marginTop: 16 }}>
            {progress.done} of {progress.total} done
          </p>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <p>Best streak</p>
              <p>{bestStreak} days</p>
            </div>
            <div className={`${styles.statBox} ${styles.brand}`}>
              <p>Active routines</p>
              <p>{routines.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ctaCard}>
        <div>
          <h3 style={{ marginBottom: 4 }}>Want to build a new habit?</h3>
          <p className={styles.metaText} style={{ fontSize: 14 }}>
            Add a routine and start your streak today.
          </p>
        </div>
        <button
          type="button"
          className={styles.newRoutineButton}
          onClick={() => setModalOpen(true)}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" /> New Routine
        </button>
      </div>

      {/* MVP-2: Goals / Achievements quick-glance widgets — see
          docs/RoutineMate-MVP2-Scope.md §3.1-3.2. Journal joins this row
          once that module lands. */}
      <div className={styles.widgetsGrid}>
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3>
              <i className="fa-solid fa-bullseye" style={{ color: '#4f46e5' }} /> Goals
            </h3>
            <Link to="/goals">View all →</Link>
          </div>
          {featuredGoal ? (
            <>
              <p className={styles.widgetItemTitle}>
                {featuredGoal.emoji} {featuredGoal.title}
              </p>
              <div className={goalsStyles.progressTrack}>
                <div
                  className={goalsStyles.progressFill}
                  style={{ width: `${featuredGoal.progress}%` }}
                />
              </div>
              <p className={styles.metaText} style={{ fontSize: 12, marginTop: 4 }}>
                {featuredGoal.progress}% there
              </p>
            </>
          ) : (
            <p className={styles.widgetEmptyText}>
              No active goals yet — set a long-term target linked to your habits.
            </p>
          )}
        </div>

        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3>
              <i className="fa-solid fa-trophy" style={{ color: '#f59e0b' }} /> Recent Achievement
            </h3>
            <Link to="/achievements">View all →</Link>
          </div>
          {recentAchievement ? (
            <div className={styles.widgetBadgeRow}>
              <div className={styles.widgetBadgeIcon}>{recentAchievement.icon}</div>
              <div>
                <p className={styles.widgetItemTitle} style={{ marginBottom: 0 }}>
                  {recentAchievement.title}
                </p>
                <p className={styles.metaText} style={{ fontSize: 12 }}>
                  {recentAchievement.unlockedAt
                    ? `Unlocked ${formatUnlockedDate(recentAchievement.unlockedAt)}`
                    : 'Unlocked'}
                  {xp ? ` · Level ${xp.level} · ${xp.totalPoints} XP` : ''}
                </p>
              </div>
            </div>
          ) : (
            <p className={styles.widgetEmptyText}>Complete habits to start earning badges.</p>
          )}
        </div>

        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3>
              <i className="fa-solid fa-book-open" style={{ color: '#059669' }} /> Quick Journal
            </h3>
            <Link to="/journal">Open →</Link>
          </div>
          <div className={journalStyles.moodPicker} style={{ marginBottom: 12 }}>
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${journalStyles.moodButton} ${journalMood === option.value ? journalStyles.moodButtonSelected : ''}`}
                style={{ width: 36, height: 36, fontSize: 16 }}
                onClick={() => setJournalMood(option.value)}
                aria-label={option.label}
                aria-pressed={journalMood === option.value}
              >
                {option.emoji}
              </button>
            ))}
          </div>
          <textarea
            className={journalStyles.noteInput}
            style={{ marginBottom: 8, fontSize: 12 }}
            rows={2}
            placeholder="How did today go?"
            value={journalNote}
            onChange={(e) => setJournalNote(e.target.value)}
          />
          <button
            type="button"
            className={styles.widgetSaveButton}
            onClick={handleSaveJournal}
            disabled={journalSaving}
          >
            {todayJournalEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>

      <RoutineFormModal
        isOpen={isModalOpen}
        editingRoutine={null}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateRoutine}
      />
    </div>
  );
}
