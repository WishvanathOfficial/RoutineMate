import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Daily check-in tracking for challenge participants
 * One record per user per challenge per date
 */
export class ChallengeCheckIn extends Model<
  InferAttributes<ChallengeCheckIn>,
  InferCreationAttributes<ChallengeCheckIn>
> {
  declare id: CreationOptional<string>;
  declare challengeId: string;
  declare userId: string;
  declare date: string; // ISO date (YYYY-MM-DD)
  declare completed: CreationOptional<boolean>;
  declare notes: CreationOptional<string>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

ChallengeCheckIn.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    challengeId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'challenge_id',
      references: { model: 'challenges', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChallengeCheckIn',
    tableName: 'challenge_check_ins',
    timestamps: true,
    underscored: true,
  },
);
