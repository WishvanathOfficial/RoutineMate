import { httpClient } from '@api/httpClient';
import { unwrap } from '@api/apiResponse';

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  participantCount: number;
  visibility: 'public' | 'private';
  daysLeft: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  creatorId: string;
  inviteToken?: string;
  joined?: boolean;
  userProgress?: number;
  userCompletedDays?: number;
  userEligibleDays?: number;
  userRank?: number;
}

export interface ChallengeDetail extends Challenge {
  feed: FeedItem[];
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  date: string;
  notes?: string;
  reactions: ReactionCount[];
  createdAt: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

export const discoverChallenges = (limit = 20, offset = 0) =>
  httpClient
    .get('/api/challenges/discover', { params: { limit, offset } })
    .then(unwrap<Challenge[]>);

export const getUserChallenges = (limit = 20, offset = 0) =>
  httpClient.get('/api/challenges/mine', { params: { limit, offset } }).then(unwrap<Challenge[]>);

export const createChallenge = (
  input: Pick<Challenge, 'title' | 'emoji' | 'visibility'> & {
    description?: string;
    startDate: string;
    endDate: string;
  },
) => httpClient.post('/api/challenges', input).then(unwrap<Challenge>);

export const getChallengeDetail = (id: string, inviteToken?: string) =>
  httpClient
    .get(`/api/challenges/${id}`, { params: inviteToken ? { inviteToken } : undefined })
    .then(unwrap<ChallengeDetail>);

export const joinChallenge = (id: string, inviteToken?: string) =>
  httpClient
    .post(`/api/challenges/${id}/join`, undefined, {
      params: inviteToken ? { inviteToken } : undefined,
    })
    .then(unwrap<Challenge>);

export const leaveChallenge = (id: string) =>
  httpClient.post(`/api/challenges/${id}/leave`).then(unwrap<Challenge>);

export const deleteChallenge = (id: string) => httpClient.delete(`/api/challenges/${id}`);

export const submitCheckIn = (id: string, date: string, completed: boolean, notes?: string) =>
  httpClient.post(`/api/challenges/${id}/check-ins`, { date, completed, notes }).then(unwrap);

export const getChallengeLeaderboard = (id: string, limit = 50) =>
  httpClient.get(`/api/challenges/${id}/leaderboard`, { params: { limit } }).then(unwrap);

export const addReaction = (challengeId: string, checkInId: string, emoji: string) =>
  httpClient
    .post(`/api/challenges/${challengeId}/check-ins/${checkInId}/reactions`, { emoji })
    .then(unwrap);
