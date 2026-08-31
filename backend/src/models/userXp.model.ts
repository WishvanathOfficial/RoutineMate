import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

// Level / xpToNextLevel / levelProgressPercent are all derived from
// totalPoints at read time — see achievements.service.ts `computeLevel()`.
export class UserXp extends Model<InferAttributes<UserXp>, InferCreationAttributes<UserXp>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare totalPoints: CreationOptional<number>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

UserXp.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_points',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'UserXp',
    tableName: 'user_xp',
    underscored: true,
  },
);
