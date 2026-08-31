import { Op } from 'sequelize';
import { FocusSession, Routine } from '../models';
import { ApiError } from '../utils/ApiError';
async function own(userId: string, id: string) {
  const s = await FocusSession.findOne({ where: { id, userId } });
  if (!s) throw ApiError.notFound('Focus session not found');
  return s;
}
export async function start(userId: string, routineId?: string | null) {
  if (routineId && !(await Routine.findOne({ where: { id: routineId, userId } })))
    throw ApiError.forbidden('Routine does not belong to you');
  if (await FocusSession.findOne({ where: { userId, status: { [Op.in]: ['running', 'paused'] } } }))
    throw ApiError.conflict('A focus session is already active');
  return FocusSession.create({
    userId,
    routineId: routineId ?? null,
    startedAt: new Date(),
    durationSeconds: 0,
    status: 'running',
    completedAt: null,
  });
}
export async function update(
  userId: string,
  id: string,
  input: { status?: 'paused' | 'running' | 'cancelled'; durationSeconds?: number },
) {
  const s = await own(userId, id);
  if (['completed', 'cancelled'].includes(s.status)) return s;
  if (input.durationSeconds !== undefined) s.durationSeconds = input.durationSeconds;
  if (input.status) s.status = input.status;
  if (input.status === 'cancelled') s.completedAt = new Date();
  await s.save();
  return s;
}
export async function complete(userId: string, id: string, durationSeconds?: number) {
  const s = await own(userId, id);
  if (s.status === 'completed') return s;
  if (durationSeconds !== undefined) s.durationSeconds = durationSeconds;
  s.status = 'completed';
  s.completedAt = new Date();
  await s.save();
  return s;
}
export async function summary(userId: string) {
  const sessions = await FocusSession.findAll({
    where: { userId, status: 'completed' },
    order: [['completedAt', 'DESC']],
    limit: 50,
  });
  return {
    totalSeconds: sessions.reduce((n, s) => n + s.durationSeconds, 0),
    sessions: sessions.map((s) => ({
      id: s.id,
      routineId: s.routineId,
      durationSeconds: s.durationSeconds,
      completedAt: s.completedAt,
    })),
  };
}
