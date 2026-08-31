import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { RoutineCategory } from './routine.model';

// docs/RoutineMate-MVP2-Scope.md §5 "OnboardingState" — one row per user,
// created lazily on first GET /api/onboarding.
export class OnboardingState extends Model<
  InferAttributes<OnboardingState>,
  InferCreationAttributes<OnboardingState>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare completed: CreationOptional<boolean>;
  declare completedAt: Date | null;
  declare categories: RoutineCategory[] | null;
  declare reminderTime: string | null;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

OnboardingState.init(
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
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    categories: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    reminderTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'reminder_time',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'OnboardingState',
    tableName: 'onboarding_states',
    underscored: true,
  },
);
