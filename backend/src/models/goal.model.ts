import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type GoalStatus = 'active' | 'completed';

// A manual checkpoint for goals that aren't purely check-in based — see
// docs/RoutineMate-MVP2-Scope.md §3.2 "manual milestone checkpoints".
export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

// docs/RoutineMate-MVP2-Scope.md §5 "Goal"
export class Goal extends Model<InferAttributes<Goal>, InferCreationAttributes<Goal>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: string;
  declare emoji: CreationOptional<string>;
  declare targetDate: string;
  declare status: CreationOptional<GoalStatus>;
  declare linkedRoutineIds: CreationOptional<string[]>;
  declare milestones: CreationOptional<GoalMilestone[]>;
  declare completedAt: string | Date | null;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Goal.init(
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
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: '🎯',
    },
    targetDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'target_date',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed'),
      allowNull: false,
      defaultValue: 'active',
    },
    linkedRoutineIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'linked_routine_ids',
    },
    milestones: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Goal',
    tableName: 'goals',
    underscored: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['user_id', 'status'] }],
  },
);
