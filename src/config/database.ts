import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database Singleton Pattern
 * Ensures a single Sequelize connection pool is shared across the application.
 */
class Database {
  private static instance: Sequelize;

  private constructor() {}

  public static getInstance(): Sequelize {
    if (!Database.instance) {
      Database.instance = new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'auction_db',
        username: process.env.DB_USER || 'auction_user',
        password: process.env.DB_PASSWORD || '',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      });
    }
    return Database.instance;
  }
}

export const sequelize = Database.getInstance();
export default Database;
