import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';

export interface FriendUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Friendship {
  id: string;
  status: 'pending' | 'accepted';
  direction: 'incoming' | 'outgoing';
  user: FriendUser;
  inviteToken?: string;
}

export interface FriendsSearchResult {
  items: FriendUser[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export type LeaderboardMetric = 'streak' | 'consistency' | 'checkins';
export type LeaderboardWindow = '7d' | '30d' | 'all';

export interface FriendsLeaderboard {
  items: Array<{
    rank: number;
    score: number;
    metric: LeaderboardMetric;
    user: FriendUser;
  }>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const getFriendships = () => httpClient.get('/api/friends').then(unwrap<Friendship[]>);

export const searchUsers = (query: string, page = 1) =>
  httpClient
    .get('/api/users/search', { params: { q: query, page, pageSize: 20 } })
    .then(unwrap<FriendsSearchResult>);

export const sendFriendRequest = (userId: string) =>
  httpClient.post('/api/friends/requests', { userId });

export const respondToFriendRequest = (id: string, action: 'accept' | 'reject') =>
  httpClient.patch(`/api/friends/requests/${id}`, { action });

export const removeFriend = (id: string) => httpClient.delete(`/api/friends/${id}`);

export const getFriendsLeaderboard = (
  metric: LeaderboardMetric,
  window: LeaderboardWindow,
  page: number,
) =>
  httpClient
    .get('/api/leaderboards', {
      params: { metric, scope: 'friends', window, page, pageSize: 20 },
    })
    .then(unwrap<FriendsLeaderboard>);
