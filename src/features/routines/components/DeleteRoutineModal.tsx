import Modal from '@components/Modal/Modal';
import styles from '../routines.module.scss';

interface DeleteRoutineModalProps {
  isOpen: boolean;
  routineName: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteRoutineModal({
  isOpen,
  routineName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteRoutineModalProps) {
  return (
    <Modal isOpen={isOpen} title="Delete Routine" onClose={onClose}>
      <div className={styles.deleteConfirmation}>
        <p>Are you sure you want to delete this routine?</p>
        {routineName && <strong>{routineName}</strong>}
        <div className={styles.deleteConfirmationActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isDeleting}
          >
            No
          </button>
          <button
            type="button"
            className={styles.deleteConfirmButton}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Yes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
