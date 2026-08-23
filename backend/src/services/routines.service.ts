import { Transaction } from 'sequelize';
import { HabitLog, Routine, sequelize } from '../models';
import { Routine as RoutineModel } from '../models/routine.model';
import { ApiError } from '../utils/ApiError';
import {
  CheckInInput,
  CreateRoutineInput,
  UpdateRoutineInput,
} from '../validators/routines.validator';

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

/** Whether `dateStr` is a day this routine is expected to be checked in on. */
function isExpectedDay(routine: RoutineModel, dateStr: string): boolean {
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
 * streak on any expected day that wasn't logged as 'done' (except today,
 * which may simply not have happened yet).
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
    } else if (dateStr !== todayIso) {
      running = 0; // missed an expected day that's already over
    }
    // if it's today and not done yet, leave `running` untouched — day isn't over
  }

  routine.currentStreak = running;
  routine.longestStreak = longest;
  await routine.save({ transaction });
}

export async function checkIn(userId: string, routineId: string, input: CheckInInput) {
  const date = input.date ?? todayStr();

  return sequelize.transaction(async (transaction) => {
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
      },
      transaction,
    });

    // findOrCreate returns the existing row as-is on a hit — apply the new
    // check-in values explicitly so re-checking-in today overwrites it.
    log.status = input.status;
    log.value = input.value != null ? String(input.value) : null;
    log.note = input.note ?? null;
    log.completedAt = input.status === 'done' ? new Date() : null;
    await log.save({ transaction });

    await recomputeStreaks(routine, transaction);

    return { routine: routine.toJSON(), log: log.toJSON() };
  });
}
