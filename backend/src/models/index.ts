import { sequelize } from '../config/database';
import { HabitLog } from './habitLog.model';
import { RefreshToken } from './refreshToken.model';
import { Routine } from './routine.model';
import { User } from './user.model';
import { UserPreferences } from './userPreferences.model';

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

export { sequelize, User, UserPreferences, RefreshToken, Routine, HabitLog };

export default {
  sequelize,
  User,
  UserPreferences,
  RefreshToken,
  Routine,
  HabitLog,
};
