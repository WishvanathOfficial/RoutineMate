import { randomUUID } from 'crypto';
import { Goal, Routine } from '../models';
import { Goal as GoalModel, GoalMilestone } from '../models/goal.model';
import { ApiError } from '../utils/ApiError';
import type { CreateGoalInput } from '../validators/goals.validator';

// docs/RoutineMate-MVP2-Scope.md §3.2/§5 "Goal". Progress is intentionally
// NOT a stored column — it's derived at read time, so it stays correct even
// as the underlying data (linked routines' streaks, or milestone toggles)
// keeps changing. A goal is auto-marked `completed` the first time its
// computed progress reaches 100.
//
// Two mutually-exclusive progress sources, per §3.2 "Goal progress bar
// computed from linked habit completions, OR manual milestone checkpoints
// for goals that aren't purely check-in based": a goal with any milestones
// is treated as milestone-based (simple % of milestones checked off) and
// its linkedRoutineIds — if any — are ignored for progress purposes; a goal
// with no milestones falls back to the original streak-ratio calculation.

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

async function computeProgress(goal: GoalModel): Promise<number> {
  if (goal.status === 'completed') return 100;

  if (goal.milestones.length > 0) {
    const doneCount = goal.milestones.filter((m) => m.done).length;
    return Math.round((doneCount / goal.milestones.length) * 100);
  }

  if (goal.linkedRoutineIds.length === 0) return 0;

  const routines = await Routine.findAll({
    where: { id: goal.linkedRoutineIds, userId: goal.userId },
  });
  if (routines.length === 0) return 0;

  const windowDays = daysBetween(goal.createdAt, new Date(`${goal.targetDate}T00:00:00Z`));
  const ratios = routines.map((r) => Math.min(1, r.currentStreak / windowDays));
  const average = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  return Math.round(average * 100);
}

function toDto(goal: GoalModel, progress: number) {
  return {
    id: goal.id,
    title: goal.title,
    emoji: goal.emoji,
    targetDate: goal.targetDate,
    status: goal.status,
    progress,
    linkedRoutineIds: goal.linkedRoutineIds,
    milestones: goal.milestones,
    completedAt: goal.completedAt ? new Date(goal.completedAt).toISOString() : null,
    createdAt: goal.createdAt.toISOString(),
  };
}

async function findOwnedGoal(userId: string, goalId: string): Promise<GoalModel> {
  const goal = await Goal.findOne({ where: { id: goalId, userId } });
  if (!goal) throw ApiError.notFound('Goal not found');
  return goal;
}

export async function listGoals(userId: string) {
  const goals = await Goal.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });

  const dtos = [];
  for (const goal of goals) {
    const progress = await computeProgress(goal);
    if (progress >= 100 && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = new Date();
      await goal.save();
    }
    dtos.push(toDto(goal, goal.status === 'completed' ? 100 : progress));
  }
  return dtos;
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  // Silently drop any linked ids the caller doesn't actually own, rather
  // than rejecting the whole request — keeps this forgiving of stale
  // client-side routine lists.
  const owned = input.linkedRoutineIds.length
    ? await Routine.findAll({
        where: { id: input.linkedRoutineIds, userId },
        attributes: ['id'],
      })
    : [];

  // Client only supplies titles — ids/done are assigned here so the
  // frontend never has to generate (or trust) its own milestone ids.
  const milestones: GoalMilestone[] = input.milestones.map((m) => ({
    id: randomUUID(),
    title: m.title,
    done: false,
  }));

  const goal = await Goal.create({
    userId,
    title: input.title,
    targetDate: input.targetDate,
    linkedRoutineIds: owned.map((r) => r.id),
    milestones,
  });
  return toDto(goal, 0);
}

/**
 * Flips a single milestone's done state and, since that can move a
 * milestone-based goal's progress to 100%, re-settles completion the same
 * way listGoals() does. One save covers both the toggle and any resulting
 * auto-completion.
 */
export async function toggleMilestone(userId: string, goalId: string, milestoneId: string) {
  const goal = await findOwnedGoal(userId, goalId);

  const index = goal.milestones.findIndex((m) => m.id === milestoneId);
  if (index === -1) throw ApiError.notFound('Milestone not found');

  goal.milestones = goal.milestones.map((m, i) => (i === index ? { ...m, done: !m.done } : m));

  const progress = await computeProgress(goal);
  if (progress >= 100 && goal.status === 'active') {
    goal.status = 'completed';
    goal.completedAt = new Date();
  }
  await goal.save();

  return toDto(goal, goal.status === 'completed' ? 100 : progress);
}
