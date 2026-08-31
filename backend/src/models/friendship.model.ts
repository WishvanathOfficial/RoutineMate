import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';
import { sequelize } from '../config/database';

export type FriendshipStatus = 'pending' | 'accepted';

export class Friendship extends Model<
  InferAttributes<Friendship>,
  InferCreationAttributes<Friendship>
> {
  declare id: CreationOptional<string>;
  declare requesterId: string;
  declare addresseeId: string;
  declare status: CreationOptional<FriendshipStatus>;
  declare inviteToken: string | null;
  declare inviteExpiresAt: Date | null;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Friendship.init(
  {
    id: { type: DataTypes.CHAR(36), defaultValue: DataTypes.UUIDV4, primaryKey: true },
    requesterId: { type: DataTypes.CHAR(36), allowNull: false, field: 'requester_id' },
    addresseeId: { type: DataTypes.CHAR(36), allowNull: false, field: 'addressee_id' },
    status: {
      type: DataTypes.ENUM('pending', 'accepted'),
      allowNull: false,
      defaultValue: 'pending',
    },
    inviteToken: {
      type: DataTypes.STRING(96),
      allowNull: true,
      unique: true,
      field: 'invite_token',
    },
    inviteExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'invite_expires_at' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: 'Friendship', tableName: 'friendships', underscored: true },
);
