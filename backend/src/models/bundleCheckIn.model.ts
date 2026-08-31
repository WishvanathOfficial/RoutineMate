import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';
export class BundleCheckIn extends Model<
  InferAttributes<BundleCheckIn>,
  InferCreationAttributes<BundleCheckIn>
> {
  declare id: CreationOptional<string>;
  declare bundleId: string;
  declare date: string;
  declare completed: boolean;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}
BundleCheckIn.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    bundleId: { type: DataTypes.CHAR(36), allowNull: false, field: 'bundle_id' },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'BundleCheckIn',
    tableName: 'bundle_check_ins',
    underscored: true,
    indexes: [{ unique: true, fields: ['bundle_id', 'date'] }],
  },
);
