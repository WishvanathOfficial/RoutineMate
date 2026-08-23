import { useNavigate } from 'react-router-dom';
import type { Routine } from '../routines.types';
import styles from '../routines.module.scss';

interface RoutineCardProps {
  routine: Routine;
  view: 'grid' | 'list';
  onEdit: (routine: Routine) => void;
  onDelete: (id: string) => void;
  onTogglePause: (id: string) => void;
}

export default function RoutineCard({
  routine,
  view,
  onEdit,
  onDelete,
  onTogglePause,
}: RoutineCardProps) {
  const navigate = useNavigate();
  const isPaused = routine.status === 'paused';

  return (
    <div
      className={`${styles.routineCard} ${view === 'list' ? styles.listView : ''} ${isPaused ? styles.paused : ''}`}
    >
      <div className={styles.routineCardTop}>
        <button
          type="button"
          className={styles.routineCardMain}
          onClick={() => navigate(`/routines/${routine.id}`)}
        >
          <span className={styles.emoji}>{routine.emoji}</span>
          <div>
            <p className={styles.name}>{routine.name}</p>
            <p className={styles.meta}>
              {routine.frequency} ·{' '}
              {routine.reminderType === 'time' ? routine.reminderTime : routine.reminderLocation}
            </p>
          </div>
        </button>

        <div className={styles.routineCardActions}>
          <button
            type="button"
            className={styles.editButton}
            aria-label={`Edit ${routine.name}`}
            onClick={() => onEdit(routine)}
          >
            <i className="fa-solid fa-pen" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            aria-label={`Delete ${routine.name}`}
            onClick={() => onDelete(routine.id)}
          >
            <i className="fa-solid fa-trash" aria-hidden="true" />
          </button>
        </div>
      </div>

      <span className={styles.category}>{routine.category}</span>

      <div className={styles.routineCardFooter}>
        <span className={styles.streak}>
          <i className="fa-solid fa-fire" aria-hidden="true" /> {routine.streak} day streak
        </span>
        <button
          type="button"
          className={styles.pauseButton}
          onClick={() => onTogglePause(routine.id)}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  );
}
