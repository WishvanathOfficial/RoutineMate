import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Reactions on challenge check-in feed items (emoji reactions)
 * Enables social engagement on shared progress
 */
export class ChallengeReaction extends Model<
  InferAttributes<ChallengeReaction>,
  InferCreationAttributes<ChallengeReaction>
> {
  declare id: CreationOptional<string>;
  declare checkInId: string;
  declare userId: string;
  declare emoji: string;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

ChallengeReaction.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    checkInId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'check_in_id',
      references: { model: 'challenge_check_ins', key: 'id' },
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
    emoji: {
      type: DataTypes.STRING(16),
      allowNull: false,
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
    modelName: 'ChallengeReaction',
    tableName: 'challenge_reactions',
    timestamps: true,
    underscored: true,
  },
);
