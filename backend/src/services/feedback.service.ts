import { FeedbackItem, FeedbackVote } from '../models';
import { ApiError } from '../utils/ApiError';
export async function list(status?: string) {
  return FeedbackItem.findAll({
    where: status ? { status } : undefined,
    order: [
      ['votes', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
}
export async function create(userId: string, title: string, description: string) {
  return FeedbackItem.create({ userId, title, description, votes: 0, status: 'planned' });
}
export async function vote(userId: string, id: string) {
  const item = await FeedbackItem.findByPk(id);
  if (!item) throw ApiError.notFound('Feedback item not found');
  const [, created] = await FeedbackVote.findOrCreate({
    where: { feedbackId: id, userId },
    defaults: { feedbackId: id, userId },
  });
  if (created) {
    item.votes += 1;
    await item.save();
  }
  return item;
}
export async function unvote(userId: string, id: string) {
  const item = await FeedbackItem.findByPk(id);
  if (!item) throw ApiError.notFound('Feedback item not found');
  const removed = await FeedbackVote.destroy({ where: { feedbackId: id, userId } });
  if (removed) {
    item.votes = Math.max(0, item.votes - 1);
    await item.save();
  }
  return item;
}
export async function setStatus(
  userId: string,
  id: string,
  status: 'planned' | 'in-progress' | 'shipped',
) {
  const moderators = process.env.MODERATOR_USER_IDS?.split(',').filter(Boolean) ?? [];
  if (!moderators.includes(userId)) throw ApiError.forbidden('Moderator access required');
  const item = await FeedbackItem.findByPk(id);
  if (!item) throw ApiError.notFound('Feedback item not found');
  item.status = status;
  await item.save();
  return item;
}
