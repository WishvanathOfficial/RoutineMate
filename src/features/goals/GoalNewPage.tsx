import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@app/hooks';
import { toastShown } from '@features/ui/ui.slice';
import GoalForm from './components/GoalForm';
import { createGoalThunk } from './goals.thunks';
import type { CreateGoalInput } from './goals.types';
import styles from './goals.module.scss';

// docs/RoutineMate-MVP2-Scope.md §4 site map: "/goals/new — Private —
// Create goal, link habits". Shares its form with the quick-add modal on
// /goals (see components/GoalForm.tsx) but is the dedicated route the site
// map calls for.
export default function GoalNewPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (input: CreateGoalInput) => {
    const result = await dispatch(createGoalThunk(input));
    if (createGoalThunk.fulfilled.match(result)) {
      dispatch(toastShown('Goal created 🎯'));
      navigate('/goals');
    } else {
      dispatch(toastShown(result.payload ?? 'Failed to create goal.'));
    }
  };

  return (
    <div>
      <button type="button" className={styles.backLink} onClick={() => navigate('/goals')}>
        ← Back to Goals
      </button>
      <div className={styles.pageHeader}>
        <div>
          <h2>New Goal</h2>
          <p>Set a long-term target and link it to your habits or break it into milestones.</p>
        </div>
      </div>
      <div className={styles.newGoalCard}>
        <GoalForm onSubmit={handleSubmit} onCancel={() => navigate('/goals')} />
      </div>
    </div>
  );
}
