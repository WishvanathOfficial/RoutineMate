import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type NotificationType = 'achievement' | 'reminder' | 'streak_risk' | 'digest' | 'nudge';

// docs/RoutineMate-MVP2-Scope.md §5 "Notification". `createdAt` doubles as
// the "fire time" the frontend shows a relative label for — snoozing a
// reminder pushes `createdAt` forward instead of adding a separate field.
export class Notification extends Model<
  InferAttributes<Notification>,
  InferCreationAttributes<Notification>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: NotificationType;
  declare message: string;
  declare read: CreationOptional<boolean>;
  declare snoozeable: CreationOptional<boolean>;
  /** Set for 'reminder'/'streak_risk' notifications (dedupe key for the
   * generator) — null for 'achievement'/'digest', which aren't per-routine. */
  declare routineId: string | null;

  declare createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Notification.init(
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
    type: {
      type: DataTypes.ENUM('achievement', 'reminder', 'streak_risk', 'digest', 'nudge'),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    snoozeable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    routineId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      field: 'routine_id',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    underscored: true,
    indexes: [{ fields: ['user_id', 'created_at'] }, { fields: ['routine_id'] }],
  },
);
