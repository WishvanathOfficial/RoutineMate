import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export class CalendarOAuthState extends Model<
  InferAttributes<CalendarOAuthState>,
  InferCreationAttributes<CalendarOAuthState>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare nonce: string;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

CalendarOAuthState.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    nonce: { type: DataTypes.STRING(36), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'CalendarOAuthState',
    tableName: 'calendar_oauth_states',
    underscored: true,
  },
);
