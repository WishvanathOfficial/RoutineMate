import { Op } from 'sequelize';
import { Friendship, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { paginationMeta, paginationOptions } from '../utils/pagination';
import { randomUUID } from 'crypto';

function publicUser(user: User) {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
}

export async function list(userId: string) {
  const rows = await Friendship.findAll({
    where: { [Op.or]: [{ requesterId: userId }, { addresseeId: userId }] },
    include: [
      { model: User, as: 'requester' },
      { model: User, as: 'addressee' },
    ],
    order: [['createdAt', 'DESC']],
  });
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    direction: r.requesterId === userId ? 'outgoing' : 'incoming',
    user: publicUser(
      (r.requesterId === userId ? (r as any).addressee : (r as any).requester) as User,
    ),
    inviteToken: r.requesterId === userId ? r.inviteToken : undefined,
  }));
}

export async function request(
  userId: string,
  input: { userId?: string; email?: string; inviteToken?: string },
) {
  let target = input.userId
    ? await User.findByPk(input.userId)
    : input.email
      ? await User.findOne({ where: { email: input.email.toLowerCase() } })
      : null;
  if (input.inviteToken) {
    const invite = await Friendship.findOne({
      where: {
        inviteToken: input.inviteToken,
        status: 'pending',
        inviteExpiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!invite) throw ApiError.notFound('Invite link is invalid or expired');
    target = await User.findByPk(invite.requesterId);
  }
  if (!target) throw ApiError.notFound('User not found');
  if (target.id === userId) throw ApiError.badRequest('You cannot add yourself');
  const existing = await Friendship.findOne({
    where: {
      [Op.or]: [
        { requesterId: userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: userId },
      ],
    },
  });
  if (existing) throw ApiError.conflict('A friendship already exists');
  return Friendship.create({
    requesterId: userId,
    addresseeId: target.id,
    status: 'pending',
    inviteToken: randomUUID().replace(/-/g, ''),
    inviteExpiresAt: new Date(Date.now() + 7 * 86400000),
  });
}

export async function action(userId: string, id: string, actionName: 'accept' | 'reject') {
  const row = await Friendship.findOne({ where: { id, addresseeId: userId, status: 'pending' } });
  if (!row) throw ApiError.notFound('Friend request not found');
  if (actionName === 'reject') {
    await row.destroy();
    return null;
  }
  row.status = 'accepted';
  await row.save();
  return row;
}

export async function remove(userId: string, id: string) {
  const row = await Friendship.findOne({
    where: { id, [Op.or]: [{ requesterId: userId }, { addresseeId: userId }] },
  });
  if (!row) throw ApiError.notFound('Friendship not found');
  await row.destroy();
}

export async function search(userId: string, q: string, page: number, pageSize: number) {
  const where = {
    id: { [Op.ne]: userId },
    [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }],
  };
  const result = await User.findAndCountAll({
    where,
    attributes: ['id', 'name', 'avatarUrl'],
    ...paginationOptions({ page, pageSize }),
    order: [['name', 'ASC']],
  });
  return { items: result.rows.map(publicUser), meta: paginationMeta(page, pageSize, result.count) };
}

export async function profile(userId: string, targetId: string) {
  const target = await User.findByPk(targetId);
  if (!target) throw ApiError.notFound('User not found');
  const friendship = await Friendship.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    },
  });
  if (!friendship && userId !== targetId)
    throw ApiError.forbidden('You must be friends to view this profile');
  return publicUser(target);
}
