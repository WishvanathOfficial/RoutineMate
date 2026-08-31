import { Op } from 'sequelize';
import { HabitLog, Notification, Routine, User, UserPreferences } from '../models';
import { isExpectedDay } from './routines.service';
import { sendMail } from './mail.service';
import { logger } from '../utils/logger';

// docs/RoutineMate-MVP2-Scope.md §6 "Notification-generation engine".
//
// Three independent generator functions, each accepting an optional `now`
// so tests can drive them deterministically instead of depending on the
// real clock. `runNotificationSweep` orchestrates all three and is what the
// scheduler (jobs/notificationScheduler.ts) calls on a ~1-minute cadence.
// Each generator is wrapped in its own try/catch inside the sweep so one
// type failing (e.g. a bad query) never blocks the others.
//
// Day/date bucketing follows the same convention as routines.service's
// `todayStr()` and habit_logs.date: the UTC calendar day (`toISOString()
// .slice(0, 10)`), NOT the server's local timezone. Time-of-day matching
// (reminder fire time, streak-risk "it's evening" cutoff, digest fire hour)
// intentionally DOES use server-local wall-clock hours/minutes, mirroring
// the pre-existing "Early Bird" achievement rule in routines.service, which
// already made the same server-local-time simplification for this phase
// (no per-user timezone is stored yet).

const STREAK_RISK_MIN_STREAK = 3;
const STREAK_RISK_HOUR = 18; // 6 PM server-local — "day's nearly over, don't lose it"
const DIGEST_HOUR_MINUTE = '20:00'; // 8 PM server-local, fires once per matching minute

// docs/RoutineMate-MVP2-Scope.md §3.5 "smart nudge — detect habits
// consistently completed late and suggest shifting the reminder time".
// Runs once/day (like the digest) rather than every tick — it's a heavier,
// multi-day-lookback query and doesn't need minute-level precision.
const NUDGE_CHECK_HOUR_MINUTE = '09:00';
const NUDGE_LOOKBACK_DAYS = 14;
const NUDGE_MIN_SAMPLES = 5; // need at least this many completed+timestamped check-ins to judge a pattern
const NUDGE_LATE_THRESHOLD_MIN = 45; // a check-in this many minutes after reminderTime counts as "late"
const NUDGE_LATE_RATIO = 0.7; // ...and it has to happen at least 70% of the time to be "consistent"
const NUDGE_COOLDOWN_DAYS = 7; // at most one nudge per routine per week

export interface SweepResult {
  reminders: number;
  streakRisks: number;
  digests: number;
  nudges: number;
  errors: string[];
}

function dateStr(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function startOfUtcDay(now: Date): Date {
  return new Date(`${dateStr(now)}T00:00:00.000Z`);
}

function localHHMM(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function isAtOrAfterDigestTime(now: Date): boolean {
  return localHHMM(now) >= DIGEST_HOUR_MINUTE;
}

function minutesOfDayFromTimeString(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesOfDayLocal(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToHHMM(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function pushEnabledUserIds(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const prefs = await UserPreferences.findAll({ where: { userId: userIds } });
  const explicit = new Map(prefs.map((p) => [p.userId, p.pushRemindersEnabled]));
  // Default to enabled when a user has no preferences row yet — matches
  // UserPreferences' own `defaultValue: true` for push_reminders_enabled.
  return new Set(userIds.filter((id) => explicit.get(id) ?? true));
}

/**
 * A reminder fires once per routine per day, at the exact minute matching
 * its configured `reminderTime`, provided: the routine is active, today is
 * one of its expected days, the user hasn't disabled push reminders, it
 * hasn't already been checked in today, and no reminder has already been
 * sent for it today (idempotent against repeated sweep ticks).
 */
export async function generateReminderNotifications(now: Date = new Date()): Promise<number> {
  const today = dateStr(now);
  const nowHHMM = localHHMM(now);

  const candidates = await Routine.findAll({
    where: { status: 'active', reminderType: 'time', reminderTime: { [Op.not]: null } },
  });
  const due = candidates.filter(
    (r) =>
      r.reminderTime !== null && r.reminderTime.slice(0, 5) === nowHHMM && isExpectedDay(r, today),
  );
  if (due.length === 0) return 0;

  const routineIds = due.map((r) => r.id);
  const userIds = [...new Set(due.map((r) => r.userId))];

  const [todaysLogs, existingReminders, enabledUserIds] = await Promise.all([
    HabitLog.findAll({ where: { routineId: routineIds, date: today } }),
    Notification.findAll({
      where: {
        routineId: routineIds,
        type: 'reminder',
        createdAt: { [Op.gte]: startOfUtcDay(now) },
      },
    }),
    pushEnabledUserIds(userIds),
  ]);
  const doneRoutineIds = new Set(
    todaysLogs.filter((l) => l.status === 'done').map((l) => l.routineId),
  );
  const alreadyReminded = new Set(existingReminders.map((n) => n.routineId));

  const toCreate = due.filter(
    (r) => enabledUserIds.has(r.userId) && !doneRoutineIds.has(r.id) && !alreadyReminded.has(r.id),
  );
  if (toCreate.length === 0) return 0;

  await Notification.bulkCreate(
    toCreate.map((r) => ({
      userId: r.userId,
      type: 'reminder' as const,
      message: `Time for "${r.name}" ${r.emoji}!`,
      read: false,
      snoozeable: true,
      routineId: r.id,
    })),
  );
  return toCreate.length;
}

/**
 * A streak-risk warning fires at most once per routine per day, starting at
 * STREAK_RISK_HOUR, for routines with a meaningful streak (>= 3) that are
 * expected today but haven't been checked in yet. Unlike reminders, this
 * isn't tied to a specific fire minute — any sweep tick from the cutoff
 * hour onward can send it, but the dedupe check keeps it to one per day.
 */
export async function generateStreakRiskNotifications(now: Date = new Date()): Promise<number> {
  if (now.getHours() < STREAK_RISK_HOUR) return 0;
  const today = dateStr(now);

  const candidates = await Routine.findAll({
    where: { status: 'active', currentStreak: { [Op.gte]: STREAK_RISK_MIN_STREAK } },
  });
  const atRisk = candidates.filter((r) => isExpectedDay(r, today));
  if (atRisk.length === 0) return 0;

  const routineIds = atRisk.map((r) => r.id);
  const userIds = [...new Set(atRisk.map((r) => r.userId))];

  const [todaysLogs, existingWarnings, enabledUserIds] = await Promise.all([
    HabitLog.findAll({ where: { routineId: routineIds, date: today } }),
    Notification.findAll({
      where: {
        routineId: routineIds,
        type: 'streak_risk',
        createdAt: { [Op.gte]: startOfUtcDay(now) },
      },
    }),
    pushEnabledUserIds(userIds),
  ]);
  const doneRoutineIds = new Set(
    todaysLogs.filter((l) => l.status === 'done').map((l) => l.routineId),
  );
  const alreadyWarned = new Set(existingWarnings.map((n) => n.routineId));

  const toCreate = atRisk.filter(
    (r) => enabledUserIds.has(r.userId) && !doneRoutineIds.has(r.id) && !alreadyWarned.has(r.id),
  );
  if (toCreate.length === 0) return 0;

  await Notification.bulkCreate(
    toCreate.map((r) => ({
      userId: r.userId,
      type: 'streak_risk' as const,
      message: `Your ${r.currentStreak}-day streak on "${r.name}" is at risk — check in before midnight!`,
      read: false,
      snoozeable: false,
      routineId: r.id,
    })),
  );
  return toCreate.length;
}

interface DigestStats {
  completed: number;
  expected: number;
}

async function computeDigestStats(userId: string, today: string): Promise<DigestStats> {
  const routines = await Routine.findAll({ where: { userId, status: 'active' } });
  const expectedRoutines = routines.filter((r) => isExpectedDay(r, today));
  if (expectedRoutines.length === 0) return { completed: 0, expected: 0 };

  const logs = await HabitLog.findAll({
    where: { routineId: expectedRoutines.map((r) => r.id), date: today, status: 'done' },
  });
  return { completed: logs.length, expected: expectedRoutines.length };
}

/**
 * A daily digest fires once per user per day, at DIGEST_HOUR_MINUTE, for
 * users who've opted into `dailyDigestEnabled`. Users with zero active
 * routines expected today are skipped (nothing to summarize).
 */
export async function generateDailyDigestNotifications(now: Date = new Date()): Promise<number> {
  if (!isAtOrAfterDigestTime(now)) return 0;
  const today = dateStr(now);

  const optedIn = await UserPreferences.findAll({ where: { dailyDigestEnabled: true } });
  if (optedIn.length === 0) return 0;
  const userIds = optedIn.map((p) => p.userId);

  const existingDigests = await Notification.findAll({
    where: {
      userId: userIds,
      type: 'digest',
      createdAt: { [Op.gte]: startOfUtcDay(now) },
    },
  });
  const alreadySent = new Set(existingDigests.map((n) => n.userId));
  const pending = userIds.filter((id) => !alreadySent.has(id));
  if (pending.length === 0) return 0;

  const users = await User.findAll({ where: { id: pending } });
  const userById = new Map(users.map((user) => [user.id, user]));

  const rows = await Promise.all(
    pending.map(async (userId) => {
      const stats = await computeDigestStats(userId, today);
      return { userId, stats };
    }),
  );
  const toCreate = rows.filter((r) => r.stats.expected > 0);
  if (toCreate.length === 0) return 0;

  let sent = 0;
  for (const { userId, stats } of toCreate) {
    const user = userById.get(userId);
    if (!user) continue;

    const message = `You completed ${stats.completed} of ${stats.expected} habit${stats.expected === 1 ? '' : 's'} today. Keep it up!`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Your RoutineMate daily digest',
        text: `Hi ${user.name.split(' ')[0]},\n\n${message}\n\nRoutineMate`,
      });
      await Notification.create({
        userId,
        type: 'digest' as const,
        message,
        read: false,
        snoozeable: false,
        routineId: null,
      });
      sent += 1;
    } catch (err) {
      logger.error(`Daily digest email failed for user ${userId}:`, err);
    }
  }
  return sent;
}

/**
 * A smart nudge fires at most once per routine per NUDGE_COOLDOWN_DAYS, for
 * time-reminder routines with at least NUDGE_MIN_SAMPLES completed check-ins
 * (with a recorded completedAt) in the trailing NUDGE_LOOKBACK_DAYS, where
 * NUDGE_LATE_RATIO or more of those check-ins landed at least
 * NUDGE_LATE_THRESHOLD_MIN after the configured reminderTime. The suggested
 * new time is the reminder time shifted by the median lateness — e.g.
 * consistently checking in ~50 minutes late suggests moving the reminder
 * ~50 minutes later, rather than fighting the user's actual routine.
 */
export async function generateSmartNudgeNotifications(now: Date = new Date()): Promise<number> {
  if (localHHMM(now) !== NUDGE_CHECK_HOUR_MINUTE) return 0;

  const candidates = await Routine.findAll({
    where: { status: 'active', reminderType: 'time', reminderTime: { [Op.not]: null } },
  });
  if (candidates.length === 0) return 0;

  const routineIds = candidates.map((r) => r.id);
  const lookbackStart = new Date(now.getTime() - NUDGE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const cooldownStart = new Date(now.getTime() - NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  const [logs, existingNudges] = await Promise.all([
    HabitLog.findAll({
      where: {
        routineId: routineIds,
        status: 'done',
        completedAt: { [Op.not]: null, [Op.gte]: lookbackStart },
      },
    }),
    Notification.findAll({
      where: { routineId: routineIds, type: 'nudge', createdAt: { [Op.gte]: cooldownStart } },
    }),
  ]);
  const recentlyNudged = new Set(existingNudges.map((n) => n.routineId));

  const logsByRoutine = new Map<string, typeof logs>();
  for (const log of logs) {
    const bucket = logsByRoutine.get(log.routineId) ?? [];
    bucket.push(log);
    logsByRoutine.set(log.routineId, bucket);
  }

  const toCreate: { userId: string; routineId: string; name: string; suggestedTime: string }[] = [];
  for (const routine of candidates) {
    if (recentlyNudged.has(routine.id) || !routine.reminderTime) continue;

    const delays: number[] = [];
    for (const log of logsByRoutine.get(routine.id) ?? []) {
      if (!log.completedAt) continue;
      delays.push(
        minutesOfDayLocal(new Date(log.completedAt)) -
          minutesOfDayFromTimeString(routine.reminderTime),
      );
    }
    if (delays.length < NUDGE_MIN_SAMPLES) continue;

    const lateDelays = delays.filter((d) => d >= NUDGE_LATE_THRESHOLD_MIN);
    if (lateDelays.length / delays.length < NUDGE_LATE_RATIO) continue;

    const reminderMinutes = minutesOfDayFromTimeString(routine.reminderTime);
    const suggestedMinutes = reminderMinutes + median(lateDelays);
    if (Math.abs(suggestedMinutes - reminderMinutes) < 15) continue; // not different enough to bother suggesting

    toCreate.push({
      userId: routine.userId,
      routineId: routine.id,
      name: routine.name,
      suggestedTime: minutesToHHMM(suggestedMinutes),
    });
  }
  if (toCreate.length === 0) return 0;

  await Notification.bulkCreate(
    toCreate.map(({ userId, routineId, name, suggestedTime }) => ({
      userId,
      type: 'nudge' as const,
      message: `You usually check in on "${name}" well after its reminder — want to shift it to ${suggestedTime}?`,
      read: false,
      snoozeable: false,
      routineId,
    })),
  );
  return toCreate.length;
}

/**
 * Orchestrates all four generators. Called by the scheduler on every tick.
 * Each generator's failure is isolated — a bug in one (e.g. a bad query)
 * never prevents the others from running.
 */
export async function runNotificationSweep(now: Date = new Date()): Promise<SweepResult> {
  const result: SweepResult = { reminders: 0, streakRisks: 0, digests: 0, nudges: 0, errors: [] };

  try {
    result.reminders = await generateReminderNotifications(now);
  } catch (err) {
    result.errors.push(`reminders: ${(err as Error).message}`);
  }

  try {
    result.streakRisks = await generateStreakRiskNotifications(now);
  } catch (err) {
    result.errors.push(`streakRisks: ${(err as Error).message}`);
  }

  try {
    result.digests = await generateDailyDigestNotifications(now);
  } catch (err) {
    result.errors.push(`digests: ${(err as Error).message}`);
  }

  try {
    result.nudges = await generateSmartNudgeNotifications(now);
  } catch (err) {
    result.errors.push(`nudges: ${(err as Error).message}`);
  }

  return result;
}
