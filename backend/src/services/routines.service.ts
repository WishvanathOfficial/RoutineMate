import { Op, Transaction } from 'sequelize';
import { HabitLog, Routine, sequelize } from '../models';
import { Routine as RoutineModel } from '../models/routine.model';
import { ApiError } from '../utils/ApiError';
import * as achievementsService from './achievements.service';
import {
  CheckInInput,
  CreateRoutineInput,
  UpdateRoutineInput,
} from '../validators/routines.validator';

/**
 * Badge/XP evaluation is a side effect of routine activity, not part of it —
 * see achievements.service.ts. Never let it fail the routine/check-in
 * request it's attached to.
 */
function evaluateAchievementsInBackground(userId: string, opts?: { justCompletedEarly?: boolean }) {
  achievementsService.evaluateAndUnlockAchievements(userId, opts).catch(() => {
    // Non-fatal — badges/XP simply won't reflect this action if this fails.
  });
}

/** Same fire-and-forget contract as evaluateAchievementsInBackground above. */
function awardCheckInXpInBackground(userId: string) {
  achievementsService.awardCheckInXp(userId).catch(() => {
    // Non-fatal — XP simply won't reflect this check-in if this fails.
  });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function findOwnedRoutine(
  userId: string,
  routineId: string,
  transaction?: Transaction,
): Promise<RoutineModel> {
  const routine = await Routine.findOne({ where: { id: routineId, userId }, transaction });
  if (!routine) throw ApiError.notFound('Routine not found');
  return routine;
}

export async function listRoutines(
  userId: string,
  filters: { status?: string; category?: string },
) {
  const where: Record<string, unknown> = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;

  const routines = await Routine.findAll({ where, order: [['createdAt', 'ASC']] });
  if (routines.length === 0) return [];

  const today = todayStr();
  const todayLogs = await HabitLog.findAll({
    where: { routineId: routines.map((r) => r.id), date: today },
  });
  const logByRoutine = new Map(todayLogs.map((l) => [l.routineId, l]));

  return routines.map((r) => ({
    ...r.toJSON(),
    completedToday: logByRoutine.get(r.id)?.status === 'done',
  }));
}

export async function getRoutine(userId: string, routineId: string) {
  const routine = await findOwnedRoutine(userId, routineId);
  const log = await HabitLog.findOne({ where: { routineId: routine.id, date: todayStr() } });
  return { ...routine.toJSON(), completedToday: log?.status === 'done' };
}

export async function getRoutineHistory(userId: string, routineId: string, days = 21) {
  const routine = await findOwnedRoutine(userId, routineId);

  const end = new Date(`${todayStr()}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const windowStart = start.toISOString().slice(0, 10);
  const windowEnd = end.toISOString().slice(0, 10);
  const activeStart = routine.startDate > windowStart ? routine.startDate : windowStart;
  const activeEnd = routine.endDate && routine.endDate < windowEnd ? routine.endDate : windowEnd;

  if (activeStart > activeEnd) return [];

  const logs = await HabitLog.findAll({
    where: {
      routineId,
      date: {
        [Op.between]: [activeStart, activeEnd],
      },
    },
    order: [['date', 'ASC']],
  });
  const logsByDate = new Map(logs.map((log) => [log.date, log.status]));

  const activeStartDate = new Date(`${activeStart}T00:00:00Z`);
  const activeEndDate = new Date(`${activeEnd}T00:00:00Z`);
  const activeDays =
    Math.floor((activeEndDate.getTime() - activeStartDate.getTime()) / 86_400_000) + 1;

  return Array.from({ length: activeDays }, (_, index) => {
    const date = new Date(activeStartDate);
    date.setUTCDate(date.getUTCDate() + index);
    const dateString = date.toISOString().slice(0, 10);
    const status = logsByDate.get(dateString);
    return {
      date: dateString,
      status:
        status === 'done'
          ? 'completed'
          : dateString === windowEnd && activeEnd === windowEnd
            ? 'pending'
            : 'missed',
    };
  });
}

export async function createRoutine(userId: string, input: CreateRoutineInput) {
  const routine = await Routine.create({
    userId,
    name: input.name,
    emoji: input.emoji ?? '✅',
    category: input.category,
    frequencyType: input.frequencyType,
    frequencyConfig: input.frequencyConfig ?? null,
    reminderType: input.reminderType ?? 'time',
    reminderTime: input.reminderTime ?? null,
    reminderLocation: input.reminderLocation ?? null,
    targetValue: input.targetValue ?? null,
    targetUnit: input.targetUnit ?? null,
    startDate: input.startDate ?? todayStr(),
    endDate: input.endDate ?? null,
  });
  evaluateAchievementsInBackground(userId); // may unlock 'first-habit'
  return routine.toJSON();
}

export async function updateRoutine(userId: string, routineId: string, input: UpdateRoutineInput) {
  const routine = await findOwnedRoutine(userId, routineId);
  routine.set(input as Partial<RoutineModel>);
  await routine.save();
  return routine.toJSON();
}

export async function deleteRoutine(userId: string, routineId: string): Promise<void> {
  const routine = await findOwnedRoutine(userId, routineId);
  await routine.destroy(); // paranoid soft delete — see design doc §3 "routines.deleted_at"
}

export async function togglePause(userId: string, routineId: string) {
  const routine = await findOwnedRoutine(userId, routineId);
  if (routine.status === 'archived') {
    throw ApiError.badRequest('Cannot pause/resume an archived routine');
  }
  routine.status = routine.status === 'paused' ? 'active' : 'paused';
  await routine.save();
  return routine.toJSON();
}

/** Whether `dateStr` is a day this routine is expected to be checked in on.
 * Exported for reuse by notificationGenerator.service.ts's streak-risk rule
 * (which needs to know whether *today* is even a day a routine is on the
 * hook for before warning about it). */
export function isExpectedDay(routine: RoutineModel, dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  switch (routine.frequencyType) {
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'specific_days':
      return (routine.frequencyConfig?.days ?? []).includes(day);
    case 'daily':
    case 'interval':
    default:
      return true;
  }
}

/**
 * Recomputes current_streak / longest_streak from habit_logs, as documented in
 * design doc §5: "cached — recomputed on every check-in write, inside the same
 * transaction." Walks day-by-day from the routine's start date to today,
 * skipping days the routine isn't expected to run, and resetting the running
 * streak on any expected day that wasn't logged as 'done' — except today
 * when there's no log for it *at all* yet, since the day simply hasn't
 * happened yet. Today explicitly logged as 'missed'/'skipped' still breaks
 * the streak immediately, same as any past day.
 */
async function recomputeStreaks(routine: RoutineModel, transaction: Transaction): Promise<void> {
  const logs = await HabitLog.findAll({
    where: { routineId: routine.id },
    order: [['date', 'ASC']],
    transaction,
  });
  const logsByDate = new Map(logs.map((l) => [l.date, l]));

  const MAX_WINDOW_DAYS = 730; // cap the walk for very old routines
  const start = new Date(`${routine.startDate}T00:00:00Z`);
  const todayIso = todayStr();
  const today = new Date(`${todayIso}T00:00:00Z`);

  const totalDays = Math.min(
    Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1,
    MAX_WINDOW_DAYS,
  );
  const rangeStart = new Date(today);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - (totalDays - 1));

  let running = 0;
  let longest = routine.longestStreak;

  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(rangeStart);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    if (!isExpectedDay(routine, dateStr)) continue;

    const log = logsByDate.get(dateStr);
    if (log?.status === 'done') {
      running += 1;
      if (running > longest) longest = running;
    } else if (dateStr !== todayIso || log) {
      // Resets the streak for: any past expected day that wasn't done, or
      // today if it was *explicitly* checked in as something other than
      // 'done' (e.g. 'missed'/'skipped') — a deliberate signal the habit
      // wasn't completed, not just "hasn't happened yet".
      running = 0;
    }
    // if it's today and there's no log at all yet, leave `running`
    // untouched — the day genuinely isn't over.
  }

  routine.currentStreak = running;
  routine.longestStreak = longest;
  await routine.save({ transaction });
}

export async function checkIn(userId: string, routineId: string, input: CheckInInput) {
  const date = input.date ?? todayStr();

  let becameDone = false;

  const result = await sequelize.transaction(async (transaction) => {
    const routine = await findOwnedRoutine(userId, routineId, transaction);

    const [log] = await HabitLog.findOrCreate({
      where: { routineId: routine.id, date },
      defaults: {
        routineId: routine.id,
        date,
        status: input.status,
        value: input.value != null ? String(input.value) : null,
        note: input.note ?? null,
        completedAt: input.status === 'done' ? new Date() : null,
        xpAwarded: false,
      },
      transaction,
    });

    // findOrCreate returns the existing row as-is on a hit — apply the new
    // check-in values explicitly so re-checking-in today overwrites it.
    // XP is awarded at most once per (routine, date): `xpAwarded` persists
    // across toggles, so marking a day done -> not-done -> done again
    // doesn't re-earn it.
    becameDone = input.status === 'done' && !log.xpAwarded;

    log.status = input.status;
    log.value = input.value != null ? String(input.value) : null;
    log.note = input.note ?? null;
    log.completedAt = input.status === 'done' ? new Date() : null;
    if (becameDone) log.xpAwarded = true;
    await log.save({ transaction });

    await recomputeStreaks(routine, transaction);

    return { routine: routine.toJSON(), log: log.toJSON() };
  });

  // 'Early Bird' — checked in done before 7 AM server time. Approximate by
  // design (server-local hour, not the user's timezone) — a reasonable cut
  // for this phase; see achievements.service.ts's module comment.
  const justCompletedEarly = input.status === 'done' && new Date().getHours() < 7;
  evaluateAchievementsInBackground(userId, { justCompletedEarly });
  if (becameDone) awardCheckInXpInBackground(userId);

  return result;
}
