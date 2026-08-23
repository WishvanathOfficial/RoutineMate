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
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (routinesStatus === 'idle') dispatch(fetchRoutinesThunk());
  }, [routinesStatus, dispatch]);

  useEffect(() => {
    dispatch(fetchGreetingThunk(user?.name.split(' ')[0] ?? 'there'));
  }, [dispatch, user]);

  const handleToggle = async (routine: Routine) => {
    const result = await dispatch(
      toggleCheckInThunk({ id: routine.id, completedToday: routine.completedToday }),
    );
    if (!toggleCheckInThunk.fulfilled.match(result)) {
      dispatch(toastShown(result.payload ?? 'Failed to update check-in.'));
    }
  };

  const handleCreateRoutine = async (input: CreateRoutineInput) => {
    const result = await dispatch(createRoutineThunk(input));
    if (createRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine created 🎉'));
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

      <RoutineFormModal
        isOpen={isModalOpen}
        editingRoutine={null}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateRoutine}
      />
    </div>
  );
}
