import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class FeedbackItem extends Model<
  InferAttributes<FeedbackItem>,
  InferCreationAttributes<FeedbackItem>
> {
  declare id: CreationOptional<string>;
  declare userId: string | null;
  declare title: string;
  declare description: string;
  declare votes: CreationOptional<number>;
  declare status: CreationOptional<'planned' | 'in-progress' | 'shipped'>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
FeedbackItem.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: true, field: 'user_id' },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    votes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('planned', 'in-progress', 'shipped'),
      allowNull: false,
      defaultValue: 'planned',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'FeedbackItem', tableName: 'feedback_items', underscored: true },
);
