import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type HabitLogStatus = 'done' | 'partial' | 'skipped' | 'missed';

// docs/RoutineMate-MVP1-Database-Design.html §3 "habit_logs" — highest write volume table
export class HabitLog extends Model<InferAttributes<HabitLog>, InferCreationAttributes<HabitLog>> {
  declare id: CreationOptional<string>;
  declare routineId: string;
  declare date: string; // DATEONLY, e.g. "2026-08-20"
  declare status: HabitLogStatus;
  declare value: string | null; // DECIMAL comes back as string from mysql2
  declare note: string | null;
  declare completedAt: Date | null;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

HabitLog.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    routineId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'routine_id',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('done', 'partial', 'skipped', 'missed'),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    modelName: 'HabitLog',
    tableName: 'habit_logs',
    underscored: true,
    indexes: [
      { unique: true, fields: ['routine_id', 'date'] }, // check-in upserts against this
      { fields: ['date'] },
    ],
  },
);
