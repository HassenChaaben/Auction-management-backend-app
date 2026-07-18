'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Receipts', {
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
      auctionId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        references: { model: 'Auctions', key: 'id' },
        onDelete: 'RESTRICT',
      },
      winnerId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      bidId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Bids', key: 'id' },
      },
      goodId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Goods', key: 'id' },
      },
      amountPaid: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      transactionId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true,
      },
      awardedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('Receipts', ['uuid'], { unique: true });
    await queryInterface.addIndex('Receipts', ['transactionId'], { unique: true });
    await queryInterface.addIndex('Receipts', ['winnerId']);
    await queryInterface.addIndex('Receipts', ['bidId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Receipts');
  },
};
