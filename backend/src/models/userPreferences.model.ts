import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type ThemeMode = 'light' | 'dark' | 'system';

// docs/RoutineMate-MVP1-Database-Design.html §3 "user_preferences" — 1:1 with users
export class UserPreferences extends Model<
  InferAttributes<UserPreferences>,
  InferCreationAttributes<UserPreferences>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare theme: CreationOptional<ThemeMode>;
  declare pushRemindersEnabled: CreationOptional<boolean>;
  declare dailyDigestEnabled: CreationOptional<boolean>;
  declare firstDayOfWeek: CreationOptional<string>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

UserPreferences.init(
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
    theme: {
      type: DataTypes.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system',
    },
    pushRemindersEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'push_reminders_enabled',
    },
    dailyDigestEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'daily_digest_enabled',
    },
    firstDayOfWeek: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'monday',
      field: 'first_day_of_week',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'UserPreferences',
    tableName: 'user_preferences',
    underscored: true,
  },
);
