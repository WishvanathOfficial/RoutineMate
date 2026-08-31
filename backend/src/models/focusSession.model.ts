import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class FocusSession extends Model<
  InferAttributes<FocusSession>,
  InferCreationAttributes<FocusSession>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare routineId: string | null;
  declare startedAt: Date;
  declare durationSeconds: CreationOptional<number>;
  declare status: CreationOptional<'running' | 'paused' | 'completed' | 'cancelled'>;
  declare completedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
FocusSession.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    routineId: { type: DataTypes.CHAR(36), allowNull: true, field: 'routine_id' },
    startedAt: { type: DataTypes.DATE, allowNull: false, field: 'started_at' },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'duration_seconds',
    },
    status: {
      type: DataTypes.ENUM('running', 'paused', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'running',
    },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'FocusSession', tableName: 'focus_sessions', underscored: true },
);
