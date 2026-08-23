import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import { selectRoutineById } from './routines.selectors';
import { deleteRoutineThunk, toggleCheckInThunk, updateRoutineThunk } from './routines.thunks';
import RoutineFormModal from './components/RoutineFormModal';
import type { CreateRoutineInput } from './routines.types';
import styles from './routines.module.scss';

// Deterministic demo heatmap so the last-35-days grid renders consistently.
const HEATMAP_PATTERN = [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1];

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const routine = useAppSelector(selectRoutineById(id ?? ''));
  const [isModalOpen, setModalOpen] = useState(false);

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
    const result = await dispatch(
      toggleCheckInThunk({ id: routine.id, completedToday: routine.completedToday }),
    );
    if (toggleCheckInThunk.fulfilled.match(result)) {
      dispatch(toastShown('Nice work! Streak updated 🔥'));
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

  const handleUpdate = async (input: CreateRoutineInput, editingId?: string) => {
    if (!editingId) return;
    const result = await dispatch(updateRoutineThunk({ id: editingId, ...input }));
    if (updateRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine updated'));
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
                className={styles.submitButton}
                disabled={routine.completedToday}
                onClick={handleMarkComplete}
              >
                {routine.completedToday ? '✓ Completed Today' : 'Mark Today Complete'}
              </button>
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3 style={{ marginBottom: 16 }}>Last 21 Days</h3>
            <div className={styles.heatmap}>
              {HEATMAP_PATTERN.map((done, index) => (
                <div key={index} className={`${styles.heatCell} ${done ? styles.done : ''}`} />
              ))}
            </div>
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
            <h3 style={{ marginBottom: 12, fontSize: 14 }}>Routine Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => setModalOpen(true)}>
                ✎ Edit routine
              </button>
              <button type="button" onClick={handleDelete} style={{ color: '#ef4444' }}>
                🗑 Delete routine
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
    </div>
  );
}
