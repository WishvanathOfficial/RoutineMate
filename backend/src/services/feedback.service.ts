import { FeedbackItem, FeedbackVote } from '../models';
import { ApiError } from '../utils/ApiError';

function toDto(item: FeedbackItem, hasVoted: boolean) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    votes: item.votes,
    status: item.status,
    createdAt: item.createdAt,
    hasVoted,
  };
}

export async function list(status?: 'planned' | 'in-progress' | 'shipped', userId?: string) {
  const items = await FeedbackItem.findAll({
    where: status ? { status } : undefined,
    order: [
      ['votes', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
  const votedIds = userId
    ? new Set(
        (
          await FeedbackVote.findAll({
            where: { userId, feedbackId: items.map((item) => item.id) },
            attributes: ['feedbackId'],
          })
        ).map((vote) => vote.feedbackId),
      )
    : new Set<string>();
  return items.map((item) => toDto(item, votedIds.has(item.id)));
}
export async function create(userId: string, title: string, description: string) {
  const item = await FeedbackItem.create({
    userId,
    title,
    description,
    votes: 0,
    status: 'planned',
  });
  return toDto(item, false);
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
  return toDto(item, true);
}
export async function unvote(userId: string, id: string) {
  const item = await FeedbackItem.findByPk(id);
  if (!item) throw ApiError.notFound('Feedback item not found');
  const removed = await FeedbackVote.destroy({ where: { feedbackId: id, userId } });
  if (removed) {
    item.votes = Math.max(0, item.votes - 1);
    await item.save();
  }
  return toDto(item, false);
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
  return toDto(item, false);
}
