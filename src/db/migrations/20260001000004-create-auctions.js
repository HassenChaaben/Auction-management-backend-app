'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Auctions', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
      },
      goodId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Goods', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdBy: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      type: {
        type: Sequelize.ENUM('ENGLISH', 'SEALED_BID'),
        allowNull: false,
      },
      state: {
        type: Sequelize.ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'CLOSED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      startingPrice: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      minimumIncrement: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 1,
      },
      startAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      winnerId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
      },
      winningBidId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('Auctions', ['uuid'], { unique: true });
    await queryInterface.addIndex('Auctions', ['state']);
    await queryInterface.addIndex('Auctions', ['type']);
    await queryInterface.addIndex('Auctions', ['goodId']);
    await queryInterface.addIndex('Auctions', ['createdBy']);
    await queryInterface.addIndex('Auctions', ['startAt']);
    await queryInterface.addIndex('Auctions', ['endAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Auctions');
  },
};
