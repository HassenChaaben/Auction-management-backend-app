import { DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../config/database';

export interface GoodAttributes {
  id: bigint;
  uuid: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  isAvailable: boolean;
  createdBy: bigint;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoodCreationAttributes
  extends Optional<GoodAttributes, 'id' | 'uuid' | 'isAvailable' | 'createdAt' | 'updatedAt'> {}

class Good extends Model<GoodAttributes, GoodCreationAttributes> implements GoodAttributes {
  public id!: bigint;
  public uuid!: string;
  public name!: string;
  public description!: string;
  public category!: string;
  public basePrice!: number;
  public isAvailable!: boolean;
  public createdBy!: bigint;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Good.init(
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    basePrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'Goods',
    modelName: 'Good',
    indexes: [
      { unique: true, fields: ['uuid'] },
      { fields: ['createdBy'] },
      { fields: ['category'] },
    ],
  }
);

export default Good;
