import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAppSelector } from '@app/hooks';
import { selectAllRoutines } from '@features/routines/routines.selectors';
import type { CreateGoalInput } from '../goals.types';
import styles from '../goals.module.scss';

interface GoalFormProps {
  onSubmit: (input: CreateGoalInput) => void;
  onCancel: () => void;
  submitLabel?: string;
}

function defaultTargetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 42);
  return d.toISOString().slice(0, 10);
}

// Shared by GoalFormModal (the quick-add modal) and GoalNewPage (the
// dedicated /goals/new route from docs/RoutineMate-MVP2-Scope.md §4's site
// map) so both stay in sync with a single implementation.
export default function GoalForm({
  onSubmit,
  onCancel,
  submitLabel = 'Create Goal',
}: GoalFormProps) {
  const routines = useAppSelector(selectAllRoutines);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [linkedRoutineIds, setLinkedRoutineIds] = useState<string[]>([]);
  const [milestoneTitles, setMilestoneTitles] = useState<string[]>([]);
  const [milestoneDraft, setMilestoneDraft] = useState('');

  const toggleRoutine = (id: string) => {
    setLinkedRoutineIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const addMilestone = () => {
    const trimmed = milestoneDraft.trim();
    if (!trimmed) return;
    setMilestoneTitles((prev) => [...prev, trimmed]);
    setMilestoneDraft('');
  };

  const removeMilestone = (index: number) => {
    setMilestoneTitles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMilestoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addMilestone();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title,
      targetDate,
      linkedRoutineIds,
      milestones: milestoneTitles.map((t) => ({ title: t })),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="goal-title">Goal title</label>
        <input
          id="goal-title"
          required
          placeholder="e.g. Run a 5K"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="goal-date">Target date</label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.groupLabel}>Milestones (optional)</span>
        <p className={styles.helperText}>
          For a goal that isn&apos;t tied to a daily habit, break it into checkpoints instead — e.g.
          &quot;Run 1K&quot;, &quot;Run 3K&quot;, &quot;Run 5K&quot;.
        </p>

        {milestoneTitles.length > 0 && (
          <ul className={styles.milestoneDraftList}>
            {milestoneTitles.map((milestoneTitle, index) => (
              <li key={`${milestoneTitle}-${index}`}>
                <span>{milestoneTitle}</span>
                <button
                  type="button"
                  aria-label={`Remove milestone ${milestoneTitle}`}
                  onClick={() => removeMilestone(index)}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.milestoneAddRow}>
          <input
            aria-label="New milestone title"
            placeholder="e.g. Run 1K without stopping"
            value={milestoneDraft}
            onChange={(e) => setMilestoneDraft(e.target.value)}
            onKeyDown={handleMilestoneKeyDown}
          />
          <button type="button" className={styles.addMilestoneButton} onClick={addMilestone}>
            Add
          </button>
        </div>
      </div>

      {routines.length > 0 && (
        <div className={styles.field}>
          <span className={styles.groupLabel}>Link habits (optional)</span>
          <div className={styles.chipRow}>
            {routines.map((routine) => (
              <label key={routine.id} className={styles.linkChip}>
                <input
                  type="checkbox"
                  checked={linkedRoutineIds.includes(routine.id)}
                  onChange={() => toggleRoutine(routine.id)}
                />
                {routine.emoji} {routine.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
