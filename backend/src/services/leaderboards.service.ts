import { Op } from 'sequelize';
import { Friendship, HabitLog, Routine, User } from '../models';
import { paginationMeta } from '../utils/pagination';

type Metric = 'streak' | 'consistency' | 'checkins';
const cache = new Map<string, { expires: number; value: unknown }>();

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
      : new Date(Date.now() - Number(window.replace('d', '')) * 86400000)
          .toISOString()
          .slice(0, 10);
  const rows = await Promise.all(
    users.map(async (user) => {
      const routines = await Routine.findAll({
        where: { userId: user.id },
        attributes: ['id', 'currentStreak'],
      });
      const logs = await HabitLog.findAll({
        where: {
          routineId: routines.map((r) => r.id),
          ...(since ? { date: { [Op.gte]: since } } : {}),
          status: 'done',
        },
        attributes: ['id'],
      });
      const streak = routines.reduce((max, r) => Math.max(max, r.currentStreak ?? 0), 0);
      const checkins = logs.length;
      const consistency =
        routines.length && window !== 'all'
          ? Math.round((checkins / (routines.length * Number(window.replace('d', '')))) * 100)
          : checkins;
      const score = metric === 'streak' ? streak : metric === 'checkins' ? checkins : consistency;
      return { user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl }, score, metric };
    }),
  );
  rows.sort((a, b) => b.score - a.score || a.user.name.localeCompare(b.user.name));
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  const result = {
    items: items.map((item, i) => ({ ...item, rank: start + i + 1 })),
    meta: paginationMeta(page, pageSize, rows.length),
  };
  cache.set(key, { expires: Date.now() + 30_000, value: result });
  return result;
}
