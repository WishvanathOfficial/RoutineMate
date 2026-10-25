import { Router } from 'express';
import * as challengesController from '../controllers/challenges.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createChallengeSchema,
  discoverChallengesSchema,
  userChallengesSchema,
  challengeIdSchema,
  joinChallengeSchema,
  leaveChallengeSchema,
  submitCheckInSchema,
  addReactionSchema,
  challengeLeaderboardSchema,
} from '../validators/challenges.validator';

const router = Router();
router.use(requireAuth);

// Discover public challenges
router.get('/discover', validate(discoverChallengesSchema), challengesController.discover);

// Get user's challenges
router.get('/mine', validate(userChallengesSchema), challengesController.getUserChallenges);

// Create challenge
router.post('/', validate(createChallengeSchema), challengesController.create);

// Delete a challenge created by the authenticated user
router.delete('/:id', validate(challengeIdSchema), challengesController.remove);

// Get challenge detail
router.get('/:id', validate(challengeIdSchema), challengesController.getDetail);

// Join challenge
router.post('/:id/join', validate(joinChallengeSchema), challengesController.join);

// Leave challenge
router.post('/:id/leave', validate(leaveChallengeSchema), challengesController.leave);

// Submit daily check-in
router.post('/:id/check-ins', validate(submitCheckInSchema), challengesController.submitCheckIn);

// Get leaderboard
router.get(
  '/:id/leaderboard',
  validate(challengeLeaderboardSchema),
  challengesController.getLeaderboard,
);

// Add reaction to check-in
router.post(
  '/:id/check-ins/:checkInId/reactions',
  validate(addReactionSchema),
  challengesController.addReaction,
);

export default router;
