import { BundleCheckIn, Routine, RoutineBundle, RoutineBundleItem } from '../models';
import { paginationMeta, paginationOptions } from '../utils/pagination';
import { ApiError } from '../utils/ApiError';
function today() {
  return new Date().toISOString().slice(0, 10);
}
async function getOwned(userId: string, id: string) {
  const bundle = await RoutineBundle.findOne({
    where: { id, userId },
    include: [
      { model: RoutineBundleItem, as: 'items', include: [{ model: Routine, as: 'routine' }] },
    ],
  });
  if (!bundle) throw ApiError.notFound('Routine bundle not found');
  return bundle;
}
function serialize(bundle: RoutineBundle) {
  const items = ((bundle as any).items ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((i: any) => ({
      id: i.id,
      routineId: i.routineId,
      position: i.position,
      routine:
        i.routine?.status === 'active'
          ? { id: i.routine.id, name: i.routine.name, emoji: i.routine.emoji }
          : null,
    }));
  return { id: bundle.id, title: bundle.title, streak: bundle.streak, items };
}
export async function list(userId: string, page = 1, pageSize = 6) {
  const result = await RoutineBundle.findAndCountAll({
    where: { userId },
    include: [
      { model: RoutineBundleItem, as: 'items', include: [{ model: Routine, as: 'routine' }] },
    ],
    order: [['createdAt', 'DESC']],
    distinct: true,
    ...paginationOptions({ page, pageSize }),
  });
  return { items: result.rows.map(serialize), meta: paginationMeta(page, pageSize, result.count) };
}
export async function create(userId: string, title: string, routineIds: string[]) {
  if (routineIds.length < 1 || new Set(routineIds).size !== routineIds.length)
    throw ApiError.badRequest('Select at least one routine');
  const count = await Routine.count({ where: { id: routineIds, userId } });
  if (count !== routineIds.length) throw ApiError.forbidden('All routines must belong to you');
  const bundle = await RoutineBundle.create({ userId, title, streak: 0 });
  await RoutineBundleItem.bulkCreate(
    routineIds.map((routineId, position) => ({ bundleId: bundle.id, routineId, position })),
  );
  return getOwned(userId, bundle.id).then(serialize);
}
export async function get(userId: string, id: string) {
  return getOwned(userId, id).then(serialize);
}
export async function update(userId: string, id: string, title?: string, routineIds?: string[]) {
  const bundle = await getOwned(userId, id);
  if (title) bundle.title = title;
  if (routineIds) {
    if (new Set(routineIds).size !== routineIds.length || routineIds.length < 2)
      throw ApiError.badRequest('A bundle needs at least two unique routines');
    const count = await Routine.count({ where: { id: routineIds, userId } });
    if (count !== routineIds.length) throw ApiError.forbidden('All routines must belong to you');
    await RoutineBundleItem.destroy({ where: { bundleId: id } });
    await RoutineBundleItem.bulkCreate(
      routineIds.map((routineId, position) => ({ bundleId: id, routineId, position })),
    );
  }
  await bundle.save();
  return getOwned(userId, id).then(serialize);
}
export async function remove(userId: string, id: string) {
  const bundle = await getOwned(userId, id);
  await bundle.destroy();
}
export async function checkIn(userId: string, id: string, completed: boolean) {
  const bundle = await getOwned(userId, id);
  const date = today();
  const itemIds = ((bundle as any).items ?? [])
    .filter((i: any) => i.routine?.status === 'active')
    .map((i: any) => i.routineId);
  if (!itemIds.length) throw ApiError.badRequest('Bundle has no active routines');
  const row =
    (await BundleCheckIn.findOne({ where: { bundleId: id, date } })) ??
    (await BundleCheckIn.create({ bundleId: id, date, completed: false }));
  row.completed = completed;
  await row.save();
  const recent = await BundleCheckIn.findAll({
    where: { bundleId: id, completed: true },
    order: [['date', 'DESC']],
    limit: 365,
  });
  let streak = 0;
  const expected = new Date();
  for (const item of recent) {
    if (item.date === expected.toISOString().slice(0, 10)) {
      streak += 1;
      expected.setUTCDate(expected.getUTCDate() - 1);
    } else break;
  }
  bundle.streak = streak;
  await bundle.save();
  return { bundle: serialize(bundle), checkIn: { date, completed } };
}
