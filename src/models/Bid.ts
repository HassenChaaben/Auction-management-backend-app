import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';

export interface BidAttributes {
  id: bigint;
  uuid: string;
  auctionId: bigint;
  bidderId: bigint;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BidCreationAttributes
  extends Optional<BidAttributes, 'id' | 'uuid' | 'createdAt' | 'updatedAt'> {}

class Bid extends Model<BidAttributes, BidCreationAttributes> implements BidAttributes {
  public id!: bigint;
  public uuid!: string;
  public auctionId!: bigint;
  public bidderId!: bigint;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bid.init(
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
    auctionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Auctions', key: 'id' },
      onDelete: 'CASCADE',
    },
    bidderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
  },
  {
    sequelize,
    tableName: 'Bids',
    modelName: 'Bid',
    indexes: [
      { unique: true, fields: ['uuid'] },
      { fields: ['auctionId'] },
      { fields: ['bidderId'] },
      { fields: ['auctionId', 'bidderId'] },
    ],
  }
);

export default Bid;
