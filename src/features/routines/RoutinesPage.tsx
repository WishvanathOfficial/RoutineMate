import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import RoutineCard from './components/RoutineCard';
import DeleteRoutineModal from './components/DeleteRoutineModal';
import RoutineFormModal from './components/RoutineFormModal';
import RoutineBundleModal from './components/RoutineBundleModal';
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
  deleteBundle,
  updateBundle,
  fetchBundles,
  type RoutineBundle,
} from './bundles.api';
import { extractApiErrorMessage } from '@api/apiError';
import Modal from '@components/Modal/Modal';
import Pagination from '@components/Pagination/Pagination';
import { useTranslation } from '../../i18n/useTranslation';

export default function RoutinesPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const routines = useAppSelector(selectAllRoutines);
  const status = useAppSelector(selectRoutinesStatus);

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bundles, setBundles] = useState<RoutineBundle[]>([]);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleCreating, setBundleCreating] = useState(false);
  const [bundlePage, setBundlePage] = useState(1);
  const [bundleTotalPages, setBundleTotalPages] = useState(1);
  const [bundleToDelete, setBundleToDelete] = useState<RoutineBundle | null>(null);
  const [bundleDeleting, setBundleDeleting] = useState(false);
  const [bundleEditing, setBundleEditing] = useState<RoutineBundle | null>(null);
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
  const openEditBundle = (bundle: RoutineBundle) => {
    setBundleEditing(bundle);
    setBundleModalOpen(true);
  };
  const closeBundleModal = () => {
    if (bundleCreating) return;
    setBundleModalOpen(false);
    setBundleEditing(null);
  };
  const saveBundle = async (input: { title: string; routineIds: string[] }) => {
    if (bundleCreating) return;
    setBundleCreating(true);
    try {
      if (bundleEditing) await updateBundle(bundleEditing.id, input);
      else await createBundleRequest(input);
      const refreshed = await fetchBundles(bundlePage, 6);
      setBundles(refreshed.items);
      setBundleTotalPages(refreshed.meta.totalPages);
      dispatch(
        toastShown(
          bundleEditing ? 'Bundle updated successfully 🎉' : 'Bundle created successfully 🎉',
        ),
      );
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Failed to create bundle.')));
      throw error;
    } finally {
      setBundleCreating(false);
    }
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setModalOpen(true);
  };
  const handleDeleteBundle = async () => {
    if (!bundleToDelete) return;
    setBundleDeleting(true);
    try {
      await deleteBundle(bundleToDelete.id);
      setBundleToDelete(null);
      const refreshed = await fetchBundles(bundlePage, 6);
      setBundles(refreshed.items);
      setBundleTotalPages(refreshed.meta.totalPages);
      dispatch(toastShown('Bundle deleted'));
    } catch (error) {
      dispatch(toastShown(extractApiErrorMessage(error, 'Failed to delete bundle.')));
    } finally {
      setBundleDeleting(false);
    }
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
          <h2>{t('My Routines')}</h2>
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
                <button
                  type="button"
                  className={styles.bundleEditButton}
                  aria-label={`Edit ${bundle.title}`}
                  onClick={() => openEditBundle(bundle)}
                >
                  <i className="fa-solid fa-pen" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.bundleDeleteButton}
                  aria-label={`Delete ${bundle.title}`}
                  onClick={() => setBundleToDelete(bundle)}
                >
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
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
        {bundles.length > 0 && (
          <Pagination page={bundlePage} totalPages={bundleTotalPages} onChange={setBundlePage} />
        )}
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
      <RoutineBundleModal
        isOpen={bundleModalOpen}
        routines={routines}
        bundle={bundleEditing}
        isSaving={bundleCreating}
        onClose={closeBundleModal}
        onSave={saveBundle}
      />
      <Modal
        isOpen={bundleToDelete !== null}
        title="Delete bundle?"
        onClose={() => !bundleDeleting && setBundleToDelete(null)}
      >
        <div className={styles.deleteConfirmation}>
          <p>
            This will permanently remove <strong>{bundleToDelete?.title}</strong> and its sequence.
          </p>
          <div className={styles.deleteConfirmationActions}>
            <button
              type="button"
              className={styles.cancelButton}
              disabled={bundleDeleting}
              onClick={() => setBundleToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.deleteConfirmButton}
              disabled={bundleDeleting}
              onClick={() => void handleDeleteBundle()}
            >
              {bundleDeleting ? 'Deleting…' : 'Delete bundle'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
