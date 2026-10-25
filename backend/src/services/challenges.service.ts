import { randomBytes, randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { Challenge, ChallengeCheckIn, ChallengeReaction, User } from '../models';
import { Challenge as ChallengeModel } from '../models/challenge.model';
import { ApiError } from '../utils/ApiError';
import type { CreateChallengeInput } from '../validators/challenges.validator';

/**
 * Challenges Service — MVP-03
 * Handles challenge CRUD, participation, check-ins, and shared progress
 */

function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.floor((b.getTime() - a.getTime()) / 86_400_000));
}

function challengeDayCount(startDate: string, endDate: string): number {
  return (
    Math.floor(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000,
    ) + 1
  );
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getParticipantIds(challenge: ChallengeModel): string[] {
  return (challenge.participantIds as string[] | null) || [];
}

export async function archiveExpiredChallenges() {
  const today = new Date().toISOString().slice(0, 10);
  await Challenge.update(
    { status: 'archived' },
    { where: { status: 'active', endDate: { [Op.lt]: today } } },
  );
}

function isExpired(challenge: ChallengeModel): boolean {
  return challenge.endDate < new Date().toISOString().slice(0, 10);
}

function toDto(
  challenge: ChallengeModel,
  userParticipating: boolean,
  userProgress?: number,
  userRank?: number,
  userCompletedDays?: number,
  userEligibleDays?: number,
) {
  const now = new Date();
  const daysLeft = daysBetween(now, new Date(challenge.endDate + 'T23:59:59Z'));

  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    emoji: challenge.emoji,
    habitTemplate: challenge.habitTemplate,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    visibility: challenge.visibility,
    status: challenge.status,
    participantCount: getParticipantIds(challenge).length,
    creatorId: challenge.creatorId,
    joined: userParticipating,
    inviteToken:
      challenge.visibility === 'private' && userParticipating ? challenge.inviteToken : undefined,
    daysLeft,
    userProgress: userProgress ?? 0,
    userRank: userRank ?? 0,
    userCompletedDays: userCompletedDays ?? 0,
    userEligibleDays: userEligibleDays ?? challengeDayCount(challenge.startDate, challenge.endDate),
  };
}

/**
 * Create a new challenge
 */
export async function createChallenge(userId: string, input: CreateChallengeInput) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  if (endDate < startDate) {
    throw ApiError.badRequest('End date must be on or after the start date');
  }

  const challenge = await Challenge.create({
    id: randomUUID(),
    creatorId: userId,
    title: input.title,
    description: input.description,
    emoji: input.emoji || '🎯',
    habitTemplate: input.habitTemplate,
    startDate: input.startDate,
    endDate: input.endDate,
    visibility: input.visibility || 'public',
    status: 'active',
    participantIds: [userId],
    participantCount: 1,
    inviteToken: input.visibility === 'private' ? generateInviteToken() : undefined,
    maxParticipants: input.maxParticipants,
  });

  return toDto(challenge, true);
}

/**
 * Get all public challenges (discover tab)
 */
export async function discoverChallenges(userId: string, limit = 20, offset = 0) {
  await archiveExpiredChallenges();
  const challenges = await Challenge.findAll({
    where: {
      visibility: 'public',
      status: 'active',
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return challenges.map((c) => {
    const userParticipating = getParticipantIds(c).includes(userId);
    return toDto(c, userParticipating);
  });
}

/**
 * Get user's challenges (my challenges tab)
 */
export async function getUserChallenges(userId: string, limit = 20, offset = 0) {
  await archiveExpiredChallenges();
  const allChallenges = await Challenge.findAll({
    where: {
      status: { [Op.in]: ['active', 'archived'] },
    },
    order: [['createdAt', 'DESC']],
  });

  // Filter challenges where user is a participant
  const userChallenges = allChallenges.filter((c) => {
    const participantIds = getParticipantIds(c);
    return participantIds.includes(userId) || c.creatorId === userId;
  });

  // Apply pagination
  const paginatedChallenges = userChallenges.slice(offset, offset + limit);

  return Promise.all(
    paginatedChallenges.map(async (c) => {
      const progress = await getChallengeUserProgress(c, userId);
      return toDto(
        c,
        getParticipantIds(c).includes(userId),
        progress.percentage,
        undefined,
        progress.completedDays,
        progress.eligibleDays,
      );
    }),
  );
}

/**
 * Get challenge details with participant list and shared progress feed
 */
export async function getChallengeDetail(
  challengeId: string,
  userId: string,
  inviteToken?: string,
) {
  await archiveExpiredChallenges();
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');

  const participantIds = getParticipantIds(challenge);
  const userParticipating = participantIds.includes(userId);
  if (
    challenge.visibility === 'private' &&
    !userParticipating &&
    (!inviteToken || inviteToken !== challenge.inviteToken)
  ) {
    throw ApiError.forbidden('You do not have access to this challenge');
  }

  const progress = userParticipating
    ? await getChallengeUserProgress(challenge, userId)
    : { percentage: 0, completedDays: 0, eligibleDays: 0 };

  // Get feed (latest check-ins with reactions)
  const feed = await ChallengeCheckIn.findAll({
    where: { challengeId, completed: true },
    include: [
      { model: User, as: 'user', attributes: ['id', 'email'] },
      { model: ChallengeReaction, as: 'reactions' },
    ],
    order: [['createdAt', 'DESC']],
    limit: 50,
  } as any);

  const feedDto = feed.map((checkIn: any) => ({
    id: checkIn.id,
    userId: checkIn.userId,
    userName: checkIn.user?.email?.split('@')[0] || 'User',
    date: checkIn.date,
    notes: checkIn.notes,
    reactions: (checkIn.reactions || []).map((r: any) => ({
      emoji: r.emoji,
      count: 1,
    })),
    createdAt: checkIn.createdAt,
  }));

  return {
    ...toDto(
      challenge,
      userParticipating,
      progress.percentage,
      undefined,
      progress.completedDays,
      progress.eligibleDays,
    ),
    feed: feedDto,
  };
}

/**
 * Join a challenge
 */
export async function joinChallenge(challengeId: string, userId: string, inviteToken?: string) {
  await archiveExpiredChallenges();
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status !== 'active' || isExpired(challenge)) {
    throw ApiError.badRequest('This challenge has ended');
  }

  const participantIds = getParticipantIds(challenge);
  if (
    challenge.visibility === 'private' &&
    !participantIds.includes(userId) &&
    (!inviteToken || inviteToken !== challenge.inviteToken)
  ) {
    throw ApiError.forbidden('A valid invite link is required to join this challenge');
  }
  if (participantIds.includes(userId)) {
    throw ApiError.badRequest('Already participating in this challenge');
  }

  if (challenge.maxParticipants && participantIds.length >= challenge.maxParticipants) {
    throw ApiError.badRequest('Challenge is full');
  }

  const updatedParticipantIds = [...participantIds, userId];
  challenge.participantIds = updatedParticipantIds;
  challenge.participantCount = updatedParticipantIds.length;
  await challenge.save();

  return toDto(challenge, true);
}

/**
 * Leave a challenge
 */
export async function leaveChallenge(challengeId: string, userId: string) {
  await archiveExpiredChallenges();
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');

  const participantIds = getParticipantIds(challenge);
  if (!participantIds.includes(userId)) {
    throw ApiError.badRequest('Not participating in this challenge');
  }

  const updatedParticipantIds = participantIds.filter((id) => id !== userId);
  challenge.participantIds = updatedParticipantIds;
  challenge.participantCount = updatedParticipantIds.length;
  await challenge.save();

  return toDto(challenge, false);
}

export async function deleteChallenge(challengeId: string, userId: string): Promise<void> {
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.creatorId !== userId) {
    throw ApiError.forbidden('Only the challenge creator can delete this challenge');
  }
  await challenge.destroy();
}

/**
 * Submit or update a daily check-in
 */
export async function submitCheckIn(
  challengeId: string,
  userId: string,
  date: string,
  completed: boolean,
  notes?: string,
) {
  await archiveExpiredChallenges();
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');
  if (challenge.status !== 'active' || isExpired(challenge)) {
    throw ApiError.badRequest('This challenge has ended');
  }

  if (!getParticipantIds(challenge).includes(userId)) {
    throw ApiError.forbidden('Not participating in this challenge');
  }
  if (
    !isDateOnly(date) ||
    date < challenge.startDate ||
    date > challenge.endDate ||
    date > new Date().toISOString().slice(0, 10)
  ) {
    throw ApiError.badRequest(
      'Check-in date must be today or earlier and within the challenge dates',
    );
  }

  // Upsert check-in
  const [checkIn] = await ChallengeCheckIn.findOrCreate({
    where: { challengeId, userId, date },
    defaults: {
      id: randomUUID(),
      challengeId,
      userId,
      date,
      completed,
      notes: notes || '',
    },
  });

  if (checkIn.completed !== completed || checkIn.notes !== (notes || '')) {
    checkIn.completed = completed;
    checkIn.notes = notes || '';
    await checkIn.save();
  }

  return {
    id: checkIn.id,
    date: checkIn.date,
    completed: checkIn.completed,
    notes: checkIn.notes || undefined,
  };
}

/**
 * Add reaction to a check-in
 */
export async function addReaction(checkInId: string, userId: string, emoji: string) {
  const checkIn = await ChallengeCheckIn.findByPk(checkInId);
  if (!checkIn) throw ApiError.notFound('Check-in not found');

  const reaction = await ChallengeReaction.create({
    id: randomUUID(),
    checkInId,
    userId,
    emoji,
  });

  return {
    id: reaction.id,
    emoji: reaction.emoji,
  };
}

/**
 * Get challenge user progress (completion percentage)
 */
async function getChallengeUserProgress(challenge: ChallengeModel, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const eligibleEndDate = today < challenge.endDate ? today : challenge.endDate;
  const eligibleDays =
    today < challenge.startDate ? 0 : challengeDayCount(challenge.startDate, eligibleEndDate);
  if (eligibleDays === 0) {
    return { percentage: 0, completedDays: 0, eligibleDays };
  }

  const completedDays = await ChallengeCheckIn.count({
    where: {
      challengeId: challenge.id,
      userId,
      completed: true,
      date: { [Op.between]: [challenge.startDate, eligibleEndDate] },
    },
  });

  return {
    percentage: Math.round((completedDays / eligibleDays) * 100),
    completedDays,
    eligibleDays,
  };
}

/**
 * Get leaderboard for a challenge
 */
export async function getChallengeLeaderboard(challengeId: string, limit = 50) {
  const challenge = await Challenge.findByPk(challengeId);
  if (!challenge) throw ApiError.notFound('Challenge not found');

  const participantIds = getParticipantIds(challenge);

  const leaderboard = await Promise.all(
    participantIds.map(async (userId) => {
      const progress = await getChallengeUserProgress(challenge, userId);
      const user = await User.findByPk(userId, { attributes: ['id', 'email'] });
      return {
        userId,
        userName: (user as any)?.email?.split('@')[0] || 'User',
        progress: progress.percentage,
      };
    }),
  );

  return leaderboard
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}
