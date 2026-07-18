import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';

export interface ReceiptAttributes {
  id: bigint;
  uuid: string;
  auctionId: bigint;
  winnerId: bigint;
  bidId: bigint;
  goodId: bigint;
  amountPaid: number;
  transactionId: string;
  awardedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReceiptCreationAttributes
  extends Optional<
    ReceiptAttributes,
    'id' | 'uuid' | 'transactionId' | 'createdAt' | 'updatedAt'
  > {}

class Receipt
  extends Model<ReceiptAttributes, ReceiptCreationAttributes>
  implements ReceiptAttributes
{
  public id!: bigint;
  public uuid!: string;
  public auctionId!: bigint;
  public winnerId!: bigint;
  public bidId!: bigint;
  public goodId!: bigint;
  public amountPaid!: number;
  public transactionId!: string;
  public awardedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Receipt.init(
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
      onDelete: 'RESTRICT',
    },
    winnerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    bidId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Bids', key: 'id' },
    },
    goodId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Goods', key: 'id' },
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    transactionId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      allowNull: false,
      unique: true,
    },
    awardedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Receipts',
    modelName: 'Receipt',
    indexes: [
      { unique: true, fields: ['uuid'] },
      { unique: true, fields: ['transactionId'] },
      { unique: true, fields: ['auctionId'] },
      { fields: ['winnerId'] },
      { fields: ['bidId'] },
    ],
  }
);

export default Receipt;
