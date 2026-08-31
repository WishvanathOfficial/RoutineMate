import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class Subscription extends Model<
  InferAttributes<Subscription>,
  InferCreationAttributes<Subscription>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare plan: 'free' | 'pro';
  declare status: string;
  declare stripeCustomerId: string | null;
  declare renewsAt: Date | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
Subscription.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id', unique: true },
    plan: { type: DataTypes.ENUM('free', 'pro'), allowNull: false, defaultValue: 'free' },
    status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'active' },
    stripeCustomerId: { type: DataTypes.STRING(120), allowNull: true, field: 'stripe_customer_id' },
    renewsAt: { type: DataTypes.DATE, allowNull: true, field: 'renews_at' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Subscription', tableName: 'subscriptions', underscored: true },
);
