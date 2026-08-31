import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class BillingEvent extends Model<
  InferAttributes<BillingEvent>,
  InferCreationAttributes<BillingEvent>
> {
  declare id: CreationOptional<string>;
  declare providerEventId: string;
  declare type: string;
  declare processedAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
BillingEvent.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    providerEventId: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      field: 'provider_event_id',
    },
    type: { type: DataTypes.STRING(100), allowNull: false },
    processedAt: { type: DataTypes.DATE, allowNull: true, field: 'processed_at' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'BillingEvent', tableName: 'billing_events', underscored: true },
);
