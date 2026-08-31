import { sequelize } from '../config/database';
import { HabitLog } from './habitLog.model';
import { RefreshToken } from './refreshToken.model';
import { Routine } from './routine.model';
import { User } from './user.model';
import { UserPreferences } from './userPreferences.model';
import { Goal } from './goal.model';
import { Achievement } from './achievement.model';
import { UserAchievement } from './userAchievement.model';
import { UserXp } from './userXp.model';
import { JournalEntry } from './journalEntry.model';
import { Notification } from './notification.model';
import { OnboardingState } from './onboardingState.model';
import { Friendship } from './friendship.model';

// Associations — see docs/RoutineMate-MVP1-Database-Design.html §4 "Relationships & Delete Behavior"

User.hasOne(UserPreferences, {
  foreignKey: 'userId',
  as: 'preferences',
  onDelete: 'CASCADE',
});
UserPreferences.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Routine, {
  foreignKey: 'userId',
  as: 'routines',
  onDelete: 'CASCADE',
});
Routine.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Routine.hasMany(HabitLog, {
  foreignKey: 'routineId',
  as: 'habitLogs',
  onDelete: 'CASCADE',
});
HabitLog.belongsTo(Routine, { foreignKey: 'routineId', as: 'routine' });

// MVP-2 associations — see docs/RoutineMate-MVP2-Scope.md §5.

User.hasMany(Goal, { foreignKey: 'userId', as: 'goals', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserAchievement, {
  foreignKey: 'userId',
  as: 'unlockedAchievements',
  onDelete: 'CASCADE',
});
UserAchievement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Achievement.hasMany(UserAchievement, { foreignKey: 'achievementId', as: 'unlocks' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', as: 'achievement' });

User.hasOne(UserXp, { foreignKey: 'userId', as: 'xp', onDelete: 'CASCADE' });
UserXp.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(JournalEntry, { foreignKey: 'userId', as: 'journalEntries', onDelete: 'CASCADE' });
JournalEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Routine.hasMany(Notification, {
  foreignKey: 'routineId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(Routine, { foreignKey: 'routineId', as: 'routine' });

User.hasOne(OnboardingState, {
  foreignKey: 'userId',
  as: 'onboardingState',
  onDelete: 'CASCADE',
});
OnboardingState.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Friendship, { foreignKey: 'requesterId', as: 'sentFriendships', onDelete: 'CASCADE' });
User.hasMany(Friendship, {
  foreignKey: 'addresseeId',
  as: 'receivedFriendships',
  onDelete: 'CASCADE',
});
Friendship.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Friendship.belongsTo(User, { foreignKey: 'addresseeId', as: 'addressee' });

export {
  sequelize,
  User,
  UserPreferences,
  RefreshToken,
  Routine,
  HabitLog,
  Goal,
  Achievement,
  UserAchievement,
  UserXp,
  JournalEntry,
  Notification,
  OnboardingState,
  Friendship,
};

export default {
  sequelize,
  User,
  UserPreferences,
  RefreshToken,
  Routine,
  HabitLog,
  Goal,
  Achievement,
  UserAchievement,
  UserXp,
  JournalEntry,
  Notification,
  OnboardingState,
  Friendship,
};
