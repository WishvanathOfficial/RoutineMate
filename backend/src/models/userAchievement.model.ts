import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

// A row's existence IS the unlock — see achievements.service.ts. Never
// deleted or updated once inserted (badges don't re-lock).
export class UserAchievement extends Model<
  InferAttributes<UserAchievement>,
  InferCreationAttributes<UserAchievement>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare achievementId: string;
  declare unlockedAt: Date;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

UserAchievement.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'user_id',
    },
    achievementId: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'achievement_id',
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'unlocked_at',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'UserAchievement',
    tableName: 'user_achievements',
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { unique: true, fields: ['user_id', 'achievement_id'] }],
  },
);
