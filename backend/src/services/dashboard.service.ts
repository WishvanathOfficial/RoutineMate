import { HabitLog, Routine } from '../models';

// Mirrors src/features/dashboard/dashboard.api.ts's static quote pool —
// design doc §7: "Quote pool can be static app config, no table required."
const QUOTES = [
  'Small steps every day lead to big change.',
  "You don't have to be great to start, but you have to start to be great.",
  'Discipline is choosing between what you want now and what you want most.',
];

export function getGreeting(userName: string): { name: string; quote: string } {
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  return { name: userName, quote };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Convenience aggregate for the dashboard's summary cards (today's routines,
 * progress ring, best streak, active count) — all derived reads over
 * routines + habit_logs, per design doc §1 "Context & Scope".
 */
export async function getDashboardOverview(userId: string) {
  const routines = await Routine.findAll({
    where: { userId, status: 'active' },
    order: [['createdAt', 'ASC']],
  });

  const today = todayStr();
  const todayLogs = await HabitLog.findAll({
    where: { routineId: routines.map((r) => r.id), date: today },
  });
  const logByRoutine = new Map(todayLogs.map((l) => [l.routineId, l]));

  const todayRoutines = routines.map((r) => ({
    ...r.toJSON(),
    completedToday: logByRoutine.get(r.id)?.status === 'done',
  }));

  const completedCount = todayRoutines.filter((r) => r.completedToday).length;
  const bestStreak = routines.reduce((max, r) => Math.max(max, r.longestStreak), 0);

  return {
    activeRoutineCount: routines.length,
    todayCompletedCount: completedCount,
    todayProgressPercentage:
      routines.length > 0 ? Math.round((completedCount / routines.length) * 100) : 0,
    bestStreak,
    todayRoutines,
  };
}
