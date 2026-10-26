import { useEffect, useState } from 'react';
import Modal from '@components/Modal/Modal';
import { extractApiErrorMessage } from '@api/apiError';
import type { Routine } from '../routines.types';
import type { RoutineBundle } from '../bundles.api';
import styles from '../routines.module.scss';

interface RoutineBundleModalProps {
  isOpen: boolean;
  routines: Routine[];
  bundle?: RoutineBundle | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: { title: string; routineIds: string[] }) => Promise<void>;
}

export default function RoutineBundleModal({
  isOpen,
  routines,
  bundle = null,
  isSaving,
  onClose,
  onSave,
}: RoutineBundleModalProps) {
  const [title, setTitle] = useState('');
  const [routineIds, setRoutineIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(bundle?.title ?? '');
      setRoutineIds(bundle?.items.map((item) => item.routineId) ?? []);
      setError(null);
    }
  }, [isOpen, bundle]);

  const save = async () => {
    if (routineIds.length < 2 || !title.trim() || isSaving) return;
    setError(null);
    try {
      await onSave({ title: title.trim(), routineIds });
      onClose();
    } catch (saveError) {
      setError(extractApiErrorMessage(saveError, 'Failed to save bundle. Please try again.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={bundle ? 'Edit Routine Bundle' : 'Create Routine Bundle'}
      onClose={() => !isSaving && onClose()}
    >
      <div className={styles.bundleForm}>
        <label htmlFor="bundle-name">Bundle name</label>
        <input
          id="bundle-name"
          required
          aria-required="true"
          placeholder="e.g. Evening Wind-down"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div>
          <strong>Habits, in order</strong>
          <p className={styles.bundleHint}>
            Select at least two active routines, in the order you want them to run.
          </p>
        </div>
        <div className={styles.bundleChoices}>
          {routines
            .filter((routine) => routine.status === 'active')
            .map((routine) => (
              <label key={routine.id}>
                <input
                  type="checkbox"
                  checked={routineIds.includes(routine.id)}
                  onChange={() =>
                    setRoutineIds((ids) =>
                      ids.includes(routine.id)
                        ? ids.filter((id) => id !== routine.id)
                        : [...ids, routine.id],
                    )
                  }
                />{' '}
                {routine.emoji} {routine.name}
              </label>
            ))}
          {routines.every((routine) => routine.status !== 'active') && (
            <p className={styles.bundleHint}>Create an active routine before building a bundle.</p>
          )}
        </div>
        {error && (
          <p role="alert" className={styles.bundleHint}>
            {error}
          </p>
        )}
        <div className={styles.bundleActions}>
          <button type="button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.sequenceButton}
            disabled={routineIds.length < 2 || !title.trim() || isSaving}
            onClick={() => void save()}
          >
            {isSaving
              ? bundle
                ? 'Saving…'
                : 'Creating…'
              : bundle
                ? 'Save Changes'
                : 'Create Bundle'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
