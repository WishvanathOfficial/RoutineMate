import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class FeedbackVote extends Model<
  InferAttributes<FeedbackVote>,
  InferCreationAttributes<FeedbackVote>
> {
  declare id: CreationOptional<string>;
  declare feedbackId: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
FeedbackVote.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    feedbackId: { type: DataTypes.CHAR(36), allowNull: false, field: 'feedback_id' },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'FeedbackVote',
    tableName: 'feedback_votes',
    underscored: true,
    indexes: [{ unique: true, fields: ['feedback_id', 'user_id'] }],
  },
);
