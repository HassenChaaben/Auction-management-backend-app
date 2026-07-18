import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';

export type AuctionState = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'CLOSED' | 'CANCELLED';
export type AuctionType = 'ENGLISH' | 'SEALED_BID';

export interface AuctionAttributes {
  id: bigint;
  uuid: string;
  goodId: bigint;
  createdBy: bigint;
  type: AuctionType;
  state: AuctionState;
  startingPrice: number;
  minimumIncrement: number;
  startAt: Date;
  endAt: Date;
  winnerId: bigint | null;
  winningBidId: bigint | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuctionCreationAttributes
  extends Optional<
    AuctionAttributes,
    | 'id'
    | 'uuid'
    | 'minimumIncrement'
    | 'winnerId'
    | 'winningBidId'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Auction
  extends Model<AuctionAttributes, AuctionCreationAttributes>
  implements AuctionAttributes
{
  public id!: bigint;
  public uuid!: string;
  public goodId!: bigint;
  public createdBy!: bigint;
  public type!: AuctionType;
  public state!: AuctionState;
  public startingPrice!: number;
  public minimumIncrement!: number;
  public startAt!: Date;
  public endAt!: Date;
  public winnerId!: bigint | null;
  public winningBidId!: bigint | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Auction.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      allowNull: false,
      unique: true,
    },
    goodId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Goods', key: 'id' },
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('ENGLISH', 'SEALED_BID'),
      allowNull: false,
    },
    state: {
      type: DataTypes.ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'CLOSED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'DRAFT',
    },
    startingPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    minimumIncrement: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 1,
      validate: { min: 0 },
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    winnerId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
    winningBidId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Auctions',
    modelName: 'Auction',
    validate: {
      chronologicalDates(this: any) {
        if (this.startAt && this.endAt && new Date(this.startAt) >= new Date(this.endAt)) {
          throw new Error('endAt must be strictly after startAt');
        }
      }
    },
    indexes: [
      { unique: true, fields: ['uuid'] },
      { fields: ['state'] },
      { fields: ['type'] },
      { fields: ['goodId'] },
      { fields: ['createdBy'] },
      { fields: ['startAt'] },
      { fields: ['endAt'] },
    ],
  }
);

export default Auction;
