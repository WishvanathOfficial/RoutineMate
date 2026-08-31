import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type RoutineCategory = 'Health' | 'Mindfulness' | 'Learning' | 'Wellness' | 'Productivity';

export type RoutineFrequencyType = 'daily' | 'weekdays' | 'specific_days' | 'interval';
export type ReminderType = 'time' | 'location';
export type RoutineStatus = 'active' | 'paused' | 'archived';
export type RoutineVisibility = 'private' | 'friends' | 'public';

export interface FrequencyConfig {
  days?: number[]; // 0=Sunday..6=Saturday, for 'specific_days'
  everyNDays?: number; // for 'interval'
}

// docs/RoutineMate-MVP1-Database-Design.html §3 "routines" — MVP-1 core
export class Routine extends Model<InferAttributes<Routine>, InferCreationAttributes<Routine>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare name: string;
  declare emoji: CreationOptional<string>;
  declare category: RoutineCategory;
  declare frequencyType: RoutineFrequencyType;
  declare frequencyConfig: FrequencyConfig | null;
  declare reminderType: CreationOptional<ReminderType>;
  declare reminderTime: string | null;
  declare reminderLocation: string | null;
  declare targetValue: number | null;
  declare targetUnit: string | null;
  declare status: CreationOptional<RoutineStatus>;
  declare visibility: CreationOptional<RoutineVisibility>;
  declare currentStreak: CreationOptional<number>;
  declare longestStreak: CreationOptional<number>;
  declare startDate: string;
  declare endDate: string | null;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
  declare readonly deletedAt: CreationOptional<Date | null>;
}

Routine.init(
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
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: '✅',
    },
    category: {
      type: DataTypes.ENUM('Health', 'Mindfulness', 'Learning', 'Wellness', 'Productivity'),
      allowNull: false,
    },
    frequencyType: {
      type: DataTypes.ENUM('daily', 'weekdays', 'specific_days', 'interval'),
      allowNull: false,
      field: 'frequency_type',
    },
    frequencyConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'frequency_config',
    },
    reminderType: {
      type: DataTypes.ENUM('time', 'location'),
      allowNull: false,
      defaultValue: 'time',
      field: 'reminder_type',
    },
    reminderTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'reminder_time',
    },
    reminderLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reminder_location',
    },
    targetValue: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_value',
    },
    targetUnit: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: 'target_unit',
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
    visibility: {
      type: DataTypes.ENUM('private', 'friends', 'public'),
      allowNull: false,
      defaultValue: 'private',
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'current_streak',
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'longest_streak',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Routine',
    tableName: 'routines',
    underscored: true,
    paranoid: true, // preserves habit_logs history after archive, design doc §3
    indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'status'] }],
  },
);
