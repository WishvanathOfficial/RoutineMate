import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class RoutineBundleItem extends Model<
  InferAttributes<RoutineBundleItem>,
  InferCreationAttributes<RoutineBundleItem>
> {
  declare id: CreationOptional<string>;
  declare bundleId: string;
  declare routineId: string;
  declare position: number;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}
RoutineBundleItem.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bundleId: { type: DataTypes.CHAR(36), allowNull: false, field: 'bundle_id' },
    routineId: { type: DataTypes.CHAR(36), allowNull: false, field: 'routine_id' },
    position: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'RoutineBundleItem',
    tableName: 'routine_bundle_items',
    underscored: true,
  },
);
