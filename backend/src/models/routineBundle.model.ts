import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class RoutineBundle extends Model<
  InferAttributes<RoutineBundle>,
  InferCreationAttributes<RoutineBundle>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: string;
  declare streak: CreationOptional<number>;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}
RoutineBundle.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.CHAR(36), allowNull: false, field: 'user_id' },
    title: { type: DataTypes.STRING(120), allowNull: false },
    streak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'RoutineBundle', tableName: 'routine_bundles', underscored: true },
);
