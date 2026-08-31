import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

// Static badge catalog, seeded in the create-achievements migration — see
// docs/RoutineMate-MVP2-Scope.md §5 "Achievement" and achievements.service.ts
// for the unlock-rule engine keyed off `id`.
export class Achievement extends Model<
  InferAttributes<Achievement>,
  InferCreationAttributes<Achievement>
> {
  declare id: string;
  declare icon: string;
  declare title: string;
  declare description: string;
  declare sortOrder: CreationOptional<number>;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Achievement.init(
  {
    id: {
      type: DataTypes.STRING(40),
      primaryKey: true,
    },
    icon: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Achievement',
    tableName: 'achievements',
    underscored: true,
  },
);
