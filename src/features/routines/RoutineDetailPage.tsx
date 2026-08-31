import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { refreshAchievementsAfterActivity } from '@features/achievements/achievements.thunks';
import { selectRoutineById } from './routines.selectors';
import { selectRoutinesStatus } from './routines.selectors';
import {
  deleteRoutineThunk,
  fetchRoutinesThunk,
  toggleCheckInThunk,
  togglePauseThunk,
  updateRoutineThunk,
} from './routines.thunks';
import RoutineFormModal from './components/RoutineFormModal';
import DeleteRoutineModal from './components/DeleteRoutineModal';
import type { CreateRoutineInput } from './routines.types';
import { fetchRoutineHistory, type RoutineHistoryDay } from './routines.api';
import styles from './routines.module.scss';

// Mirrors the streak thresholds in
// backend/src/services/achievements.service.ts's STREAK_RULES — see
// docs/RoutineMate-MVP2-Scope.md §3.1 "progress-to-next-badge shown on the
// Routine Detail page". This is a local, this-routine-only approximation
// (the real unlock is based on the highest streak across ALL of a user's
// routines) but gives an accurate, motivating number for the routine
// someone is actually looking at.
const STREAK_BADGE_THRESHOLDS = [7, 30, 100, 365];

const HISTORY_STATUS_CLASS = {
  completed: styles.done,
  missed: styles.missed,
  pending: styles.pending,
  not_active: styles.not_active,
} as const;

function nextStreakBadge(streak: number): { threshold: number; remaining: number } | null {
  const threshold = STREAK_BADGE_THRESHOLDS.find((t) => streak < t);
  return threshold ? { threshold, remaining: threshold - streak } : null;
}

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const routine = useAppSelector(selectRoutineById(id ?? ''));
  const routinesStatus = useAppSelector(selectRoutinesStatus);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [history, setHistory] = useState<RoutineHistoryDay[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (routinesStatus === 'idle') dispatch(fetchRoutinesThunk());
  }, [routinesStatus, dispatch]);

  useEffect(() => {
    if (!routine) return;
    let active = true;
    setHistoryLoading(true);
    fetchRoutineHistory(routine.id)
      .then((days) => {
        if (active) setHistory(days);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [routine]);

  if (!routine && (routinesStatus === 'idle' || routinesStatus === 'loading')) {
    return <p className={styles.historyMessage}>Loading routine...</p>;
  }

  if (!routine) {
    return (
      <div>
        <button type="button" className={styles.backLink} onClick={() => navigate('/routines')}>
          ← Back to Routines
        </button>
        <p className={styles.emptyState}>Routine not found.</p>
      </div>
    );
  }

  const handleMarkComplete = async () => {
    const result = await dispatch(toggleCheckInThunk({ routine }));
    if (toggleCheckInThunk.fulfilled.match(result)) {
      dispatch(toastShown('Nice work! Streak updated 🔥'));
      const updatedHistory = await fetchRoutineHistory(routine.id);
      setHistory(updatedHistory);
      if (!routine.completedToday) dispatch(refreshAchievementsAfterActivity());
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to update check-in.'));
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteRoutineThunk(routine.id));
    if (deleteRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine deleted'));
      navigate('/routines');
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to delete routine.'));
    }
  };

  const handleTogglePause = async () => {
    const result = await dispatch(togglePauseThunk(routine.id));
    if (togglePauseThunk.fulfilled.match(result)) {
      dispatch(
        toastShown(result.payload.status === 'paused' ? 'Routine paused' : 'Routine resumed'),
      );
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to update routine.'));
    }
  };

  const handleUpdate = async (input: CreateRoutineInput, editingId?: string) => {
    if (!editingId) return;
    const result = await dispatch(updateRoutineThunk({ id: editingId, ...input }));
    if (updateRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine updated'));
      const updatedHistory = await fetchRoutineHistory(editingId);
      setHistory(updatedHistory);
      setModalOpen(false);
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to update routine.'));
    }
  };

  return (
    <div>
      <button type="button" className={styles.backLink} onClick={() => navigate('/routines')}>
        ← Back to Routines
      </button>

      <div className={styles.detailGrid}>
        <div>
          <div className={styles.detailCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 32 }}>{routine.emoji}</span>
                <div>
                  <h2>{routine.name}</h2>
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>
                    {routine.frequency} · Reminder{' '}
                    {routine.reminderType === 'time'
                      ? `at ${routine.reminderTime}`
                      : `at ${routine.reminderLocation}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`${styles.submitButton} ${styles.detailCompleteButton}`}
                disabled={routine.completedToday}
                onClick={handleMarkComplete}
              >
                {routine.completedToday ? (
                  <>
                    <i className="fa-solid fa-check-double" aria-hidden="true" /> Completed Today
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" aria-hidden="true" /> Mark Today Complete
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3 style={{ marginBottom: 16 }}>
              {history.length < 21 ? 'Since Started' : 'Last 21 Days'}
            </h3>
            {historyLoading ? (
              <p className={styles.historyMessage}>Loading activity...</p>
            ) : history.length === 0 ? (
              <p className={styles.historyMessage}>Activity history unavailable.</p>
            ) : (
              <>
                <div className={styles.heatmap}>
                  {history.map((day) => (
                    <div
                      key={day.date}
                      className={`${styles.heatCell} ${HISTORY_STATUS_CLASS[day.status]}`}
                      title={`${day.date}: ${day.status}`}
                      aria-label={`${day.date}: ${day.status}`}
                    />
                  ))}
                </div>
                <div className={styles.heatmapLegend}>
                  <span>
                    <i className={`${styles.legendSwatch} ${styles.done}`} /> Completed
                  </span>
                  <span>
                    <i className={`${styles.legendSwatch} ${styles.missed}`} /> Missed
                  </span>
                  <span>
                    <i className={`${styles.legendSwatch} ${styles.pending}`} /> Pending
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className={styles.detailCard} style={{ textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Current Streak</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>🔥 {routine.streak}</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginTop: 16,
                textAlign: 'left',
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Longest streak</p>
                <p style={{ fontWeight: 700 }}>{routine.longestStreak} days</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>Category</p>
                <p style={{ fontWeight: 700 }}>{routine.category}</p>
              </div>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3 style={{ marginBottom: 8, fontSize: 14 }}>Next Badge</h3>
            {(() => {
              const next = nextStreakBadge(routine.streak);
              if (!next) {
                return (
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>
                    🏆 This habit has cleared every streak badge!
                  </p>
                );
              }
              const percent = Math.round(
                ((next.threshold - next.remaining) / next.threshold) * 100,
              );
              return (
                <>
                  <p style={{ fontSize: 13, marginBottom: 8 }}>
                    {next.remaining} more day{next.remaining === 1 ? '' : 's'} to unlock{' '}
                    <strong>🔥 {next.threshold}-Day Streak</strong>
                  </p>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: 'var(--bg-hover)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        borderRadius: 999,
                        background: '#f59e0b',
                      }}
                    />
                  </div>
                </>
              );
            })()}
          </div>

          <div className={styles.detailCard}>
            <h3 style={{ marginBottom: 12, fontSize: 14 }}>Routine Settings</h3>
            <div className={styles.routineSettings}>
              <button
                type="button"
                className={styles.settingsAction}
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-pen" aria-hidden="true" /> Edit routine
              </button>
              <button type="button" className={styles.settingsAction} onClick={handleTogglePause}>
                <i className="fa-solid fa-pause" aria-hidden="true" />{' '}
                {routine.status === 'paused' ? 'Resume routine' : 'Pause routine'}
              </button>
              <button
                type="button"
                className={`${styles.settingsAction} ${styles.dangerSettingsAction}`}
                onClick={() => setDeleteModalOpen(true)}
              >
                <i className="fa-solid fa-trash" aria-hidden="true" /> Delete routine
              </button>
            </div>
          </div>
        </div>
      </div>

      <RoutineFormModal
        isOpen={isModalOpen}
        editingRoutine={routine}
        onClose={() => setModalOpen(false)}
        onSubmit={handleUpdate}
      />
      <DeleteRoutineModal
        isOpen={isDeleteModalOpen}
        routineName={routine.name}
        isDeleting={false}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          setDeleteModalOpen(false);
          await handleDelete();
        }}
      />
    </div>
  );
}
