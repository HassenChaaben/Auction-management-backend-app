import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';

export interface WalletAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WalletCreationAttributes
  extends Optional<WalletAttributes, 'id' | 'uuid' | 'createdAt' | 'updatedAt'> {}

class Wallet extends Model<WalletAttributes, WalletCreationAttributes> implements WalletAttributes {
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public balance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Wallet.init(
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
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    sequelize,
    tableName: 'Wallets',
    modelName: 'Wallet',
    indexes: [
      { unique: true, fields: ['uuid'] },
      { unique: true, fields: ['userId'] },
    ],
  }
);

export default Wallet;
