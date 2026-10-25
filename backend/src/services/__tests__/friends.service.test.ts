jest.mock('../../models', () => ({
  Friendship: { findAll: jest.fn() },
  User: {},
}));

import { Op } from 'sequelize';
import { Friendship, User } from '../../models';
import * as friendsService from '../friends.service';

describe('friends.service list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads both association aliases and maps outgoing and incoming friends', async () => {
    (Friendship.findAll as jest.Mock).mockResolvedValue([
      {
        id: 'friendship-out',
        requesterId: 'current-user',
        addresseeId: 'friend-a',
        status: 'accepted',
        inviteToken: null,
        addressee: { id: 'friend-a', name: 'Friend A', avatarUrl: null },
      },
      {
        id: 'friendship-in',
        requesterId: 'friend-b',
        addresseeId: 'current-user',
        status: 'pending',
        inviteToken: null,
        requester: { id: 'friend-b', name: 'Friend B', avatarUrl: null },
      },
      {
        id: 'friendship-deleted-user',
        requesterId: 'current-user',
        addresseeId: 'deleted-user',
        status: 'accepted',
        addressee: null,
      },
    ]);

    const result = await friendsService.list('current-user');

    expect(Friendship.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [{ requesterId: 'current-user' }, { addresseeId: 'current-user' }],
      },
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'addressee' },
      ],
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual([
      {
        id: 'friendship-out',
        status: 'accepted',
        direction: 'outgoing',
        user: { id: 'friend-a', name: 'Friend A', avatarUrl: null },
        inviteToken: null,
      },
      {
        id: 'friendship-in',
        status: 'pending',
        direction: 'incoming',
        user: { id: 'friend-b', name: 'Friend B', avatarUrl: null },
        inviteToken: undefined,
      },
    ]);
  });
});
