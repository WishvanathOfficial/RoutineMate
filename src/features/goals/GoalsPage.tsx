import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { selectAllRoutines } from '@features/routines/routines.selectors';
import { toastShown } from '@features/ui/ui.slice';
import { selectAllGoals, selectGoalsStatus } from './goals.selectors';
import { createGoalThunk, fetchGoalsThunk, toggleGoalMilestoneThunk } from './goals.thunks';
import GoalForm from './components/GoalForm';
import Modal from '@components/Modal/Modal';
import { deleteGoal } from './goals.api';
import type { Goal } from './goals.types';
import styles from './goals.module.scss';

function formatTargetDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysLeft(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GoalsPage() {
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectAllGoals);
  const status = useAppSelector(selectGoalsStatus);
  const routines = useAppSelector(selectAllRoutines);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const confirmDelete = async () => {
    if (!goalToDelete) return;
    setDeleting(true);
    try {
      await deleteGoal(goalToDelete.id);
      setGoalToDelete(null);
      dispatch(fetchGoalsThunk());
      dispatch(toastShown('Goal deleted'));
    } catch {
      dispatch(toastShown('Failed to delete goal.'));
    } finally {
      setDeleting(false);
    }
  };
  const createGoal = async (input: import('./goals.types').CreateGoalInput) => {
    const result = await dispatch(createGoalThunk(input));
    if (createGoalThunk.fulfilled.match(result)) {
      setNewGoalOpen(false);
      dispatch(toastShown('Goal created 🎯'));
    } else dispatch(toastShown(result.payload ?? 'Failed to create goal.'));
  };

  useEffect(() => {
    if (status === 'idle') dispatch(fetchGoalsThunk());
  }, [status, dispatch]);

  const linkedLabel = (goal: Goal): string => {
    const linked = routines.filter((r) => goal.linkedRoutineIds.includes(r.id));
    if (linked.length === 0) return 'No habits linked';
    return linked.map((r) => `${r.emoji} ${r.name}`).join(', ');
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const result = await dispatch(toggleGoalMilestoneThunk({ goalId, milestoneId }));
    if (!toggleGoalMilestoneThunk.fulfilled.match(result)) {
      dispatch(toastShown(result.payload ?? 'Failed to update milestone.'));
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Goals</h2>
          <p>Long-term targets linked to your daily routines.</p>
        </div>
        <button type="button" className={styles.newGoalButton} onClick={() => setNewGoalOpen(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New Goal
        </button>
      </div>

      {status === 'loading' && goals.length === 0 ? (
        <p className={styles.emptyState}>Loading goals…</p>
      ) : goals.length === 0 ? (
        <p className={styles.emptyState}>No goals yet — set your first long-term target.</p>
      ) : (
        <div className={styles.grid}>
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`${styles.goalCard} ${goal.status === 'completed' ? styles.goalCardDone : ''}`}
            >
              <div className={styles.goalCardHeader}>
                <div>
                  <span className={styles.goalEmoji}>{goal.emoji}</span>
                  <h3>{goal.title}</h3>
                  <p className={styles.goalMeta}>
                    {goal.status === 'completed'
                      ? `Completed ${formatTargetDate(goal.completedAt ?? goal.targetDate)}`
                      : `Target: ${formatTargetDate(goal.targetDate)} · ${daysLeft(goal.targetDate)} days left`}
                  </p>
                </div>
                <span
                  className={`${styles.statusBadge} ${goal.status === 'completed' ? styles.statusBadgeDone : ''}`}
                >
                  {goal.status === 'completed' ? 'Completed' : 'Active'}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${goal.status === 'completed' ? styles.progressFillDone : ''}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {goal.milestones.length > 0 && (
                <ul className={styles.milestoneList}>
                  {goal.milestones.map((milestone) => (
                    <li key={milestone.id}>
                      <label
                        className={`${styles.milestoneItem} ${milestone.done ? styles.milestoneItemDone : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={milestone.done}
                          onChange={() => handleToggleMilestone(goal.id, milestone.id)}
                        />
                        {milestone.title}
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.goalFooter}>
                <span className={styles.goalPercent}>{goal.progress}% complete</span>
                {goal.milestones.length === 0 && (
                  <span className={styles.linkedChip}>{linkedLabel(goal)}</span>
                )}
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setGoalToDelete(goal)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        isOpen={goalToDelete !== null}
        title="Delete goal?"
        onClose={() => !deleting && setGoalToDelete(null)}
      >
        <p>
          Delete <strong>{goalToDelete?.title}</strong> permanently?
        </p>
        <div className={styles.modalActions}>
          <button type="button" onClick={() => setGoalToDelete(null)} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => void confirmDelete()}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete goal'}
          </button>
        </div>
      </Modal>
      <Modal isOpen={newGoalOpen} title="Create New Goal" onClose={() => setNewGoalOpen(false)}>
        <GoalForm onSubmit={createGoal} onCancel={() => setNewGoalOpen(false)} />
      </Modal>
    </div>
  );
}
