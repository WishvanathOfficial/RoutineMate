import { Op } from 'sequelize';
import { HabitLog, Routine } from '../models';
import { HabitLog as HabitLogModel } from '../models/habitLog.model';

// Response shape intentionally mirrors the frontend's StatsSummary contract
// (src/features/stats/stats.types.ts) so wiring up the real API later is a
// drop-in replacement for the mock in stats.api.ts.
export interface WeeklyCompletionPoint {
  day: string;
  percentage: number;
}
export interface CategoryBreakdownPoint {
  category: string;
  count: number;
}
export interface TimeOfDayPoint {
  label: string;
  percentage: number;
}
export interface StatsSummary {
  totalCheckIns: number;
  completionRate: number;
  bestStreak: number;
  activeRoutines: number;
  weekly: WeeklyCompletionPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  trend30Day: number[];
  timeOfDay: TimeOfDayPoint[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildWeekly(logs: HabitLogModel[], routineCount: number): WeeklyCompletionPoint[] {
  const points: WeeklyCompletionPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dateStr = isoDateNDaysAgo(i);
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const done = dayLogs.filter((l) => l.status === 'done').length;
    const percentage = routineCount > 0 ? Math.round((done / routineCount) * 100) : 0;
    const label = DAY_LABELS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];
    points.push({ day: label, percentage });
  }
  return points;
}

function buildCategoryBreakdown(routines: Routine[]): CategoryBreakdownPoint[] {
  const counts = new Map<string, number>();
  for (const r of routines) {
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

function buildTrend30Day(logs: HabitLogModel[], routineCount: number): number[] {
  const trend: number[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const dateStr = isoDateNDaysAgo(i);
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const done = dayLogs.filter((l) => l.status === 'done').length;
    trend.push(routineCount > 0 ? Math.round((done / routineCount) * 100) : 0);
  }
  return trend;
}

function buildTimeOfDay(logs: HabitLogModel[]): TimeOfDayPoint[] {
  const buckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  let total = 0;

  for (const log of logs) {
    if (!log.completedAt) continue;
    total += 1;
    const hour = new Date(log.completedAt).getUTCHours();
    if (hour >= 5 && hour < 12) buckets.Morning += 1;
    else if (hour >= 12 && hour < 17) buckets.Afternoon += 1;
    else if (hour >= 17 && hour < 21) buckets.Evening += 1;
    else buckets.Night += 1;
  }

  return Object.entries(buckets).map(([label, count]) => ({
    label,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function emptySummary(activeRoutines: number, bestStreak: number): StatsSummary {
  const weekly: WeeklyCompletionPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dateStr = isoDateNDaysAgo(i);
    weekly.push({ day: DAY_LABELS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()], percentage: 0 });
  }

  return {
    totalCheckIns: 0,
    completionRate: 0,
    bestStreak,
    activeRoutines,
    weekly,
    categoryBreakdown: [],
    trend30Day: new Array(30).fill(0),
    timeOfDay: [
      { label: 'Morning', percentage: 0 },
      { label: 'Afternoon', percentage: 0 },
      { label: 'Evening', percentage: 0 },
      { label: 'Night', percentage: 0 },
    ],
  };
}

export async function getStatsSummary(userId: string): Promise<StatsSummary> {
  const routines = await Routine.findAll({ where: { userId } });
  const activeRoutines = routines.filter((r) => r.status === 'active').length;
  const bestStreak = routines.reduce((max, r) => Math.max(max, r.longestStreak), 0);

  const routineIds = routines.map((r) => r.id);
  if (routineIds.length === 0) {
    return emptySummary(activeRoutines, bestStreak);
  }

  const since = isoDateNDaysAgo(29);
  const logs = await HabitLog.findAll({
    where: { routineId: routineIds, date: { [Op.gte]: since } },
  });

  const totalCheckIns = logs.filter((l) => l.status === 'done').length;
  const weekly = buildWeekly(logs, routineIds.length);
  const categoryBreakdown = buildCategoryBreakdown(routines);
  const trend30Day = buildTrend30Day(logs, routineIds.length);
  const timeOfDay = buildTimeOfDay(logs);
  const completionRate = trend30Day.length
    ? Math.round(trend30Day.reduce((a, b) => a + b, 0) / trend30Day.length)
    : 0;

  return {
    totalCheckIns,
    completionRate,
    bestStreak,
    activeRoutines,
    weekly,
    categoryBreakdown,
    trend30Day,
    timeOfDay,
  };
}
