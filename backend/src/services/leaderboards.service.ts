import { Op } from 'sequelize';
import { Friendship, HabitLog, Routine, User } from '../models';
import type { Routine as RoutineModel } from '../models/routine.model';
import { paginationMeta } from '../utils/pagination';

type Metric = 'streak' | 'consistency' | 'checkins';
interface LeaderboardResult {
  items: Array<{
    rank: number;
    score: number;
    metric: Metric;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  meta: ReturnType<typeof paginationMeta>;
}
const cache = new Map<string, { expires: number; value: LeaderboardResult }>();

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function expectedOnDate(routine: RoutineModel, date: string): boolean {
  if (routine.frequencyType === 'interval') {
    const everyNDays = Math.max(1, routine.frequencyConfig?.everyNDays ?? 1);
    const elapsed =
      (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${routine.startDate}T00:00:00Z`)) / 86_400_000;
    return elapsed >= 0 && elapsed % everyNDays === 0;
  }

  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (routine.frequencyType === 'weekdays') return weekday >= 1 && weekday <= 5;
  if (routine.frequencyType === 'specific_days') {
    return (routine.frequencyConfig?.days ?? []).includes(weekday);
  }
  return true;
}

function expectedCheckInDays(routines: RoutineModel[], startDate: string, endDate: string): number {
  let expectedDays = 0;
  for (const routine of routines) {
    const firstDate = routine.startDate > startDate ? routine.startDate : startDate;
    const lastDate = routine.endDate && routine.endDate < endDate ? routine.endDate : endDate;
    for (
      let timestamp = Date.parse(`${firstDate}T00:00:00Z`);
      timestamp <= Date.parse(`${lastDate}T00:00:00Z`);
      timestamp += 86_400_000
    ) {
      if (expectedOnDate(routine, dateString(new Date(timestamp)))) expectedDays += 1;
    }
  }
  return expectedDays;
}

export async function getFriendsLeaderboard(
  userId: string,
  metric: Metric,
  window: '7d' | '30d' | 'all',
  page: number,
  pageSize: number,
) {
  const key = `${userId}:${metric}:${window}:${page}:${pageSize}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const friendships = await Friendship.findAll({
    where: { status: 'accepted', [Op.or]: [{ requesterId: userId }, { addresseeId: userId }] },
  });
  const ids = [
    userId,
    ...friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId)),
  ];
  const users = await User.findAll({ where: { id: ids }, attributes: ['id', 'name', 'avatarUrl'] });
  const since =
    window === 'all'
      ? null
      : dateString(new Date(Date.now() - (Number(window.replace('d', '')) - 1) * 86400000));
  const today = dateString(new Date());
  const rows = await Promise.all(
    users.map(async (user) => {
      const routines = await Routine.findAll({
        where: {
          userId: user.id,
          status: 'active',
          ...(user.id === userId ? {} : { visibility: { [Op.in]: ['friends', 'public'] } }),
        },
        attributes: [
          'id',
          'currentStreak',
          'frequencyType',
          'frequencyConfig',
          'startDate',
          'endDate',
        ],
      });
      const logs = await HabitLog.findAll({
        where: {
          routineId: routines.map((r) => r.id),
          date: {
            [Op.between]: [
              since ??
                routines.reduce(
                  (earliest, routine) =>
                    routine.startDate < earliest ? routine.startDate : earliest,
                  today,
                ),
              today,
            ],
          },
          status: 'done',
        },
        attributes: ['id', 'date'],
      });
      const streak = routines.reduce((max, r) => Math.max(max, r.currentStreak ?? 0), 0);
      const checkins = logs.length;
      const consistencyStart =
        since ??
        routines.reduce(
          (earliest, routine) => (routine.startDate < earliest ? routine.startDate : earliest),
          today,
        );
      const eligibleCheckIns = expectedCheckInDays(routines, consistencyStart, today);
      const consistency = eligibleCheckIns
        ? Math.min(100, Math.round((checkins / eligibleCheckIns) * 100))
        : 0;
      const score = metric === 'streak' ? streak : metric === 'checkins' ? checkins : consistency;
      return { user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl }, score, metric };
    }),
  );
  rows.sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name));
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  const result: LeaderboardResult = {
    items: items.map((item, i) => ({ ...item, rank: start + i + 1 })),
    meta: paginationMeta(page, pageSize, rows.length),
  };
  cache.set(key, { expires: Date.now() + 30_000, value: result });
  return result;
}
