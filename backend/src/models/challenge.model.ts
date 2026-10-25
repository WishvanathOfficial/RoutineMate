import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type ChallengeVisibility = 'public' | 'private';
export type ChallengeStatus = 'active' | 'completed' | 'archived';

/**
 * Group challenge model for MVP-03
 * Supports public/private time-boxed challenges tied to a habit template
 * Participants track daily check-ins toward shared goals
 */
export class Challenge extends Model<
  InferAttributes<Challenge>,
  InferCreationAttributes<Challenge>
> {
  declare id: CreationOptional<string>;
  declare creatorId: string;
  declare title: string;
  declare description: CreationOptional<string>;
  declare emoji: CreationOptional<string>;
  declare habitTemplate: CreationOptional<string>; // e.g., "meditation", "water", "exercise"
  declare startDate: string; // ISO date
  declare endDate: string; // ISO date
  declare visibility: CreationOptional<ChallengeVisibility>;
  declare status: CreationOptional<ChallengeStatus>;
  declare participantIds: CreationOptional<string[]>; // JSON array of user IDs
  declare participantCount: CreationOptional<number>;
  declare inviteToken: CreationOptional<string>; // For sharing private challenges
  declare maxParticipants: CreationOptional<number | null>; // null = unlimited

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Challenge.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    creatorId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'creator_id',
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emoji: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: '🎯',
    },
    habitTemplate: {
      type: DataTypes.STRING(128),
      allowNull: true,
      field: 'habit_template',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'end_date',
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private'),
      allowNull: false,
      defaultValue: 'public',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
    participantIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'participant_ids',
    },
    participantCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'participant_count',
    },
    inviteToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'invite_token',
      unique: true,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_participants',
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
    modelName: 'Challenge',
    tableName: 'challenges',
    timestamps: true,
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
);
