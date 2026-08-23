import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import RoutineCard from './components/RoutineCard';
import RoutineFormModal from './components/RoutineFormModal';
import { selectAllRoutines, selectRoutinesStatus } from './routines.selectors';
import {
  createRoutineThunk,
  deleteRoutineThunk,
  fetchRoutinesThunk,
  togglePauseThunk,
  updateRoutineThunk,
} from './routines.thunks';
import type { CreateRoutineInput, Routine } from './routines.types';
import styles from './routines.module.scss';

export default function RoutinesPage() {
  const dispatch = useAppDispatch();
  const routines = useAppSelector(selectAllRoutines);
  const status = useAppSelector(selectRoutinesStatus);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRoutinesThunk());
    }
  }, [status, dispatch]);

  const openCreateModal = () => {
    setEditingRoutine(null);
    setModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setModalOpen(true);
  };

  const handleSubmit = async (input: CreateRoutineInput, editingId?: string) => {
    if (editingId) {
      const result = await dispatch(updateRoutineThunk({ id: editingId, ...input }));
      if (updateRoutineThunk.fulfilled.match(result)) {
        dispatch(toastShown('Routine updated'));
        setModalOpen(false);
      } else {
        dispatch(toastShown(result.payload ?? 'Failed to update routine.'));
      }
    } else {
      const result = await dispatch(createRoutineThunk(input));
      if (createRoutineThunk.fulfilled.match(result)) {
        dispatch(toastShown('Routine created 🎉'));
        setModalOpen(false);
      } else {
        dispatch(toastShown(result.payload ?? 'Failed to create routine.'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await dispatch(deleteRoutineThunk(id));
    if (deleteRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine deleted'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to delete routine.'));
    }
  };

  const handleTogglePause = async (id: string) => {
    const result = await dispatch(togglePauseThunk(id));
    if (!togglePauseThunk.fulfilled.match(result)) {
      dispatch(toastShown(result.payload ?? 'Failed to update routine.'));
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>My Routines</h2>
          <p>Manage all your habits in one place.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={view === 'grid' ? styles.active : ''}
              onClick={() => setView('grid')}
              aria-label="Grid view"
            >
              <i className="fa-solid fa-grip" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={view === 'list' ? styles.active : ''}
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <i className="fa-solid fa-list" aria-hidden="true" />
            </button>
          </div>
          <button type="button" className={styles.submitButton} onClick={openCreateModal}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> New Routine
          </button>
        </div>
      </div>

      {routines.length === 0 ? (
        <p className={styles.emptyState}>
          No routines yet — create your first one to start a streak.
        </p>
      ) : (
        <div className={view === 'grid' ? styles.grid : styles.list}>
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              view={view}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onTogglePause={handleTogglePause}
            />
          ))}
        </div>
      )}

      <RoutineFormModal
        isOpen={isModalOpen}
        editingRoutine={editingRoutine}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
