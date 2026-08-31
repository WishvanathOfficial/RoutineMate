import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

// docs/RoutineMate-MVP2-Scope.md §5 "JournalEntry" — one row per user per
// day, enforced by a DB unique constraint; journal.service.ts upserts.
export class JournalEntry extends Model<
  InferAttributes<JournalEntry>,
  InferCreationAttributes<JournalEntry>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare date: string;
  declare mood: number;
  declare note: string;

  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

JournalEntry.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      field: 'user_id',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mood: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'JournalEntry',
    tableName: 'journal_entries',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'date'] }],
  },
);
