import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class CalendarConnection extends Model<
  InferAttributes<CalendarConnection>,
  InferCreationAttributes<CalendarConnection>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare provider: 'google' | 'apple';
  declare encryptedAccessToken: string;
  declare encryptedRefreshToken: string;
  declare expiresAt: Date | null;
  declare status: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
CalendarConnection.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    provider: { type: DataTypes.ENUM('google', 'apple'), allowNull: false },
    encryptedAccessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'encrypted_access_token',
    },
    encryptedRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'encrypted_refresh_token',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'connected' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'CalendarConnection',
    tableName: 'calendar_connections',
    underscored: true,
  },
);
