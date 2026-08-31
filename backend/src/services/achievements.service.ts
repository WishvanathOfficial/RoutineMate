import { Op } from 'sequelize';
import { Achievement, HabitLog, Notification, Routine, UserAchievement, UserXp } from '../models';

// docs/RoutineMate-MVP2-Scope.md §3.4/§5 "Achievement" + "UserXP".
//
// The badge catalog itself lives in the `achievements` table (seeded once,
// in the create-achievements migration, plus the add-more-achievement-badges
// follow-up migration for the 365-day streak / 500-checkin / consistency
// badges). This service owns two things on top of that static catalog:
//   1. The unlock-rule engine — evaluateAndUnlockAchievements() is called
//      (best-effort, non-blocking) after routines.service's createRoutine
//      and checkIn, and decides which badges just became true.
//   2. Read-side shaping for GET /api/achievements — merging catalog +
//      per-user unlock state + a dynamic "N more to go" hint for badges
//      that are still locked but rule-based (streak/check-in thresholds).
//
// `perfect-week` has no automatic rule here (would require tracking every
// active routine's daily completion in lockstep) and stays manual/seed-only
// for this phase — a reasonable scope cut flagged for a future iteration.
// `consistency-4wk` below is the real "4 weeks at 90%+" badge the scope doc
// asks for and does have an automatic rule (see meetsConsistencyThreshold).

const XP_PER_ACHIEVEMENT = 50;
const XP_PER_CHECKIN = 10;
const XP_PER_LEVEL = 200;

const STREAK_RULES: Record<string, number> = {
  'streak-7': 7,
  'streak-30': 30,
  'streak-100': 100,
  'streak-365': 365,
};

const CHECKIN_RULES: Record<string, number> = {
  'checkins-50': 50,
  'checkins-100': 100,
  'checkins-500': 500,
};

// "4 weeks at 90%+" — approximated as: at least CONSISTENCY_MIN_LOGGED
// habit_logs recorded in the trailing 28 days (a little under the full 28
// so someone who missed a day or two of *logging* isn't unfairly excluded),
// of which at least CONSISTENCY_MIN_RATE were 'done'.
const CONSISTENCY_ACHIEVEMENT_ID = 'consistency-4wk';
const CONSISTENCY_MIN_LOGGED = 20;
const CONSISTENCY_MIN_RATE = 0.9;

interface UserAchievementStats {
  totalDoneCount: number;
  maxCurrentStreak: number;
  routineCount: number;
  last28LoggedCount: number;
  last28DoneCount: number;
}

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function meetsConsistencyThreshold(stats: UserAchievementStats): boolean {
  if (stats.last28LoggedCount < CONSISTENCY_MIN_LOGGED) return false;
  return stats.last28DoneCount / stats.last28LoggedCount >= CONSISTENCY_MIN_RATE;
}

async function computeUserStats(userId: string): Promise<UserAchievementStats> {
  const since28 = isoDateNDaysAgo(27); // trailing 28-day window, inclusive of today
  const [totalDoneCount, maxCurrentStreak, routineCount, last28LoggedCount, last28DoneCount] =
    await Promise.all([
      HabitLog.count({
        where: { status: 'done' },
        include: [{ model: Routine, as: 'routine', where: { userId }, attributes: [] }],
      }),
      Routine.max('currentStreak', { where: { userId } }) as Promise<number | null>,
      Routine.count({ where: { userId } }),
      HabitLog.count({
        where: { date: { [Op.gte]: since28 } },
        include: [{ model: Routine, as: 'routine', where: { userId }, attributes: [] }],
      }),
      HabitLog.count({
        where: { status: 'done', date: { [Op.gte]: since28 } },
        include: [{ model: Routine, as: 'routine', where: { userId }, attributes: [] }],
      }),
    ]);
  return {
    totalDoneCount,
    maxCurrentStreak: maxCurrentStreak ?? 0,
    routineCount,
    last28LoggedCount,
    last28DoneCount,
  };
}

/**
 * Per-check-in XP — see docs/RoutineMate-MVP2-Scope.md §3.1 "Points/XP
 * awarded per check-in". Called by routines.service's checkIn() the first
 * time a given (routine, date) transitions to 'done' (guarded by
 * HabitLog.xpAwarded so toggling a day on/off/on repeatedly can't farm XP).
 * Best-effort/non-blocking, same contract as evaluateAndUnlockAchievements.
 */
export async function awardCheckInXp(userId: string): Promise<void> {
  const [xpRow] = await UserXp.findOrCreate({ where: { userId }, defaults: { userId } });
  xpRow.totalPoints += XP_PER_CHECKIN;
  await xpRow.save();
}

export function computeLevel(totalPoints: number) {
  const intoLevel = totalPoints % XP_PER_LEVEL;
  return {
    totalPoints,
    level: Math.floor(totalPoints / XP_PER_LEVEL) + 1,
    xpToNextLevel: XP_PER_LEVEL - intoLevel,
    levelProgressPercent: Math.round((intoLevel / XP_PER_LEVEL) * 100),
  };
}

function computeProgressLabel(
  achievementId: string,
  stats: UserAchievementStats,
  fallback: string,
): string {
  const streakThreshold = STREAK_RULES[achievementId];
  if (streakThreshold) {
    const remaining = streakThreshold - stats.maxCurrentStreak;
    if (remaining > 0) return `${remaining} more day${remaining === 1 ? '' : 's'} to go`;
  }
  const checkinThreshold = CHECKIN_RULES[achievementId];
  if (checkinThreshold) {
    const remaining = checkinThreshold - stats.totalDoneCount;
    if (remaining > 0) return `${remaining} more to go`;
  }
  return fallback;
}

export async function getAchievementsForUser(userId: string) {
  const [catalog, unlocks, stats, xpRow] = await Promise.all([
    Achievement.findAll({ order: [['sortOrder', 'ASC']] }),
    UserAchievement.findAll({ where: { userId } }),
    computeUserStats(userId),
    UserXp.findOne({ where: { userId } }),
  ]);

  const unlockByAchievementId = new Map(unlocks.map((u) => [u.achievementId, u.unlockedAt]));

  const items = catalog.map((achievement) => {
    const unlockedAt = unlockByAchievementId.get(achievement.id) ?? null;
    return {
      id: achievement.id,
      icon: achievement.icon,
      title: achievement.title,
      unlockedAt: unlockedAt ? unlockedAt.toISOString().slice(0, 10) : null,
      progressLabel: unlockedAt
        ? null
        : computeProgressLabel(achievement.id, stats, achievement.description),
    };
  });

  return { items, xp: computeLevel(xpRow?.totalPoints ?? 0) };
}

/**
 * Best-effort unlock check — called after a routine is created or checked
 * in. Never throws; callers should still wrap this in try/catch since it
 * touches the DB independently of the caller's own transaction.
 */
export async function evaluateAndUnlockAchievements(
  userId: string,
  opts: { justCompletedEarly?: boolean } = {},
): Promise<void> {
  const [stats, existing, catalog] = await Promise.all([
    computeUserStats(userId),
    UserAchievement.findAll({ where: { userId } }),
    Achievement.findAll(),
  ]);
  const alreadyUnlocked = new Set(existing.map((u) => u.achievementId));
  const catalogById = new Map(catalog.map((a) => [a.id, a]));

  const satisfied: string[] = [];
  if (stats.routineCount >= 1) satisfied.push('first-habit');
  if (stats.maxCurrentStreak >= 7) satisfied.push('streak-7');
  if (stats.maxCurrentStreak >= 30) satisfied.push('streak-30');
  if (stats.maxCurrentStreak >= 100) satisfied.push('streak-100');
  if (stats.maxCurrentStreak >= 365) satisfied.push('streak-365');
  if (stats.totalDoneCount >= 50) satisfied.push('checkins-50');
  if (stats.totalDoneCount >= 100) satisfied.push('checkins-100');
  if (stats.totalDoneCount >= 500) satisfied.push('checkins-500');
  if (meetsConsistencyThreshold(stats)) satisfied.push(CONSISTENCY_ACHIEVEMENT_ID);
  if (opts.justCompletedEarly) satisfied.push('early-bird');

  const newlyUnlocked = satisfied.filter((id) => catalogById.has(id) && !alreadyUnlocked.has(id));
  if (newlyUnlocked.length === 0) return;

  const now = new Date();
  await UserAchievement.bulkCreate(
    newlyUnlocked.map((achievementId) => ({ userId, achievementId, unlockedAt: now })),
  );

  await Notification.bulkCreate(
    newlyUnlocked.map((achievementId) => ({
      userId,
      type: 'achievement' as const,
      message: `New badge unlocked: ${catalogById.get(achievementId)!.title}!`,
      read: false,
      snoozeable: false,
      routineId: null, // not tied to a single routine
    })),
  );

  const [xpRow] = await UserXp.findOrCreate({ where: { userId }, defaults: { userId } });
  xpRow.totalPoints += XP_PER_ACHIEVEMENT * newlyUnlocked.length;
  await xpRow.save();
}
