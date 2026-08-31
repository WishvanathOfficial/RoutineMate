import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import RoutineCard from './components/RoutineCard';
import DeleteRoutineModal from './components/DeleteRoutineModal';
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
import {
  createBundle as createBundleRequest,
  fetchBundles,
  type RoutineBundle,
} from './bundles.api';
import { extractApiErrorMessage } from '@api/apiError';
import Modal from '@components/Modal/Modal';
import Pagination from '@components/Pagination/Pagination';

export default function RoutinesPage() {
  const dispatch = useAppDispatch();
  const routines = useAppSelector(selectAllRoutines);
  const status = useAppSelector(selectRoutinesStatus);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bundles, setBundles] = useState<RoutineBundle[]>([]);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleRoutineIds, setBundleRoutineIds] = useState<string[]>([]);
  const [bundleCreating, setBundleCreating] = useState(false);
  const [bundlePage, setBundlePage] = useState(1);
  const [bundleTotalPages, setBundleTotalPages] = useState(1);
  const [routinePage, setRoutinePage] = useState(1);
  const routinesPerPage = 6;
  const routineTotalPages = Math.max(1, Math.ceil(routines.length / routinesPerPage));

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchRoutinesThunk());
    }
  }, [status, dispatch]);
  useEffect(() => {
    void fetchBundles(bundlePage, 6)
      .then((result) => {
        setBundles(result.items);
        setBundleTotalPages(result.meta.totalPages);
      })
      .catch(() => undefined);
  }, [bundlePage]);

  const openCreateModal = () => {
    setEditingRoutine(null);
    setModalOpen(true);
  };
  const createBundle = async () => {
    if (bundleRoutineIds.length < 1 || bundleCreating) return;
    setBundleCreating(true);
    try {
      await createBundleRequest({
        title: bundleTitle.trim() || 'My Routine Bundle',
        routineIds: bundleRoutineIds,
      });
      const refreshed = await fetchBundles(bundlePage, 6);
      setBundles(refreshed.items);
      setBundleTotalPages(refreshed.meta.totalPages);
      setBundleModalOpen(false);
      setBundleTitle('');
      setBundleRoutineIds([]);
      dispatch(toastShown('Bundle created successfully 🎉'));
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Failed to create bundle.')));
    } finally {
      setBundleCreating(false);
    }
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

  const requestDelete = (id: string) => {
    const routine = routines.find((item) => item.id === id);
    if (routine) setRoutineToDelete(routine);
  };

  const handleDelete = async () => {
    if (!routineToDelete) return;

    setIsDeleting(true);
    const result = await dispatch(deleteRoutineThunk(routineToDelete.id));
    setIsDeleting(false);
    setRoutineToDelete(null);
    if (deleteRoutineThunk.fulfilled.match(result)) {
      dispatch(toastShown('Routine deleted'));
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to delete routine.'));
    }
  };

  const handleTogglePause = async (id: string) => {
    const result = await dispatch(togglePauseThunk(id));
    if (togglePauseThunk.fulfilled.match(result)) {
      dispatch(
        toastShown(result.payload.status === 'paused' ? 'Routine paused' : 'Routine resumed'),
      );
    } else {
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
          <button
            type="button"
            className={styles.bundleButton}
            onClick={() => setBundleModalOpen(true)}
          >
            <i className="fa-solid fa-layer-group" aria-hidden="true" /> Create Bundle
          </button>
          <button type="button" className={styles.submitButton} onClick={openCreateModal}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> New Routine
          </button>
        </div>
      </div>

      <section className={`${styles.bundlesSection} ${view === 'list' ? styles.bundlesList : ''}`}>
        <p className={styles.sectionLabel}>BUNDLES</p>
        {bundles.length === 0 ? (
          <p className={styles.emptyState}>No bundles yet — create one to group your routines.</p>
        ) : (
          bundles.map((bundle) => (
            <div className={styles.bundleCard} key={bundle.id}>
              <div className={styles.bundleHeader}>
                <h3>
                  <i className="fa-solid fa-layer-group" aria-hidden="true" /> {bundle.title}
                </h3>
                <span className={styles.streak}>🔥 {bundle.streak} day streak</span>
              </div>
              <p className={styles.bundleSteps}>
                {bundle.items.map((item) => item.routine?.emoji ?? '•').join(' → ')}{' '}
                <span>{bundle.items.length} steps</span>
              </p>
              <Link to={`/routines/bundles/${bundle.id}`} className={styles.sequenceButton}>
                Start Sequence
              </Link>
            </div>
          ))
        )}
        <Pagination page={bundlePage} totalPages={bundleTotalPages} onChange={setBundlePage} />
      </section>
      <p className={styles.sectionLabel}>ALL ROUTINES</p>
      {routines.length === 0 ? (
        <p className={styles.emptyState}>
          No routines yet — create your first one to start a streak.
        </p>
      ) : (
        <div className={view === 'grid' ? styles.grid : styles.list}>
          {routines
            .slice((routinePage - 1) * routinesPerPage, routinePage * routinesPerPage)
            .map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                view={view}
                onEdit={openEditModal}
                onDelete={requestDelete}
                onTogglePause={handleTogglePause}
              />
            ))}
          <Pagination page={routinePage} totalPages={routineTotalPages} onChange={setRoutinePage} />
        </div>
      )}

      <RoutineFormModal
        isOpen={isModalOpen}
        editingRoutine={editingRoutine}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <DeleteRoutineModal
        isOpen={routineToDelete !== null}
        routineName={routineToDelete?.name ?? null}
        isDeleting={isDeleting}
        onClose={() => setRoutineToDelete(null)}
        onConfirm={handleDelete}
      />
      <Modal
        isOpen={bundleModalOpen}
        title="Create Routine Bundle"
        onClose={() => setBundleModalOpen(false)}
      >
        <div className={styles.bundleForm}>
          <label htmlFor="bundle-name">Bundle name</label>
          <input
            id="bundle-name"
            placeholder="e.g. Evening Wind-down"
            value={bundleTitle}
            onChange={(e) => setBundleTitle(e.target.value)}
          />
          <div>
            <strong>Habits, in order</strong>
            <p className={styles.bundleHint}>Check habits in the order you want them to run.</p>
          </div>
          <div className={styles.bundleChoices}>
            {routines
              .filter((r) => r.status === 'active')
              .map((routine) => (
                <label key={routine.id}>
                  <input
                    type="checkbox"
                    checked={bundleRoutineIds.includes(routine.id)}
                    onChange={() =>
                      setBundleRoutineIds((ids) =>
                        ids.includes(routine.id)
                          ? ids.filter((id) => id !== routine.id)
                          : [...ids, routine.id],
                      )
                    }
                  />{' '}
                  {routine.emoji} {routine.name}
                </label>
              ))}
          </div>
          <div className={styles.bundleActions}>
            <button
              type="button"
              onClick={() => setBundleModalOpen(false)}
              disabled={bundleCreating}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.sequenceButton}
              disabled={bundleRoutineIds.length < 1 || bundleCreating}
              onClick={() => void createBundle()}
            >
              {bundleCreating ? 'Creating…' : 'Create Bundle'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
