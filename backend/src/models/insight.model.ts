import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class Insight extends Model<InferAttributes<Insight>, InferCreationAttributes<Insight>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare weekOf: string;
  declare summaryText: string;
  declare suggestions: string[];
  declare provider: string;
  declare promptVersion: string;
  declare fallback: boolean;
  declare viewedAt: Date | null;
  declare feedback: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}
Insight.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    weekOf: { type: DataTypes.DATEONLY, allowNull: false, field: 'week_of' },
    summaryText: { type: DataTypes.TEXT, allowNull: false, field: 'summary_text' },
    suggestions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    provider: { type: DataTypes.STRING(30), allowNull: false },
    promptVersion: { type: DataTypes.STRING(20), allowNull: false, field: 'prompt_version' },
    fallback: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    viewedAt: { type: DataTypes.DATE, allowNull: true, field: 'viewed_at' },
    feedback: { type: DataTypes.STRING(20), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Insight',
    tableName: 'insights',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'week_of'] }],
  },
);
