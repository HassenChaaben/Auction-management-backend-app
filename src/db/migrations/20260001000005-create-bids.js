'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bids', {
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
        references: { model: 'Auctions', key: 'id' },
        onDelete: 'CASCADE',
      },
      bidderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('Bids', ['uuid'], { unique: true });
    await queryInterface.addIndex('Bids', ['auctionId']);
    await queryInterface.addIndex('Bids', ['bidderId']);
    await queryInterface.addIndex('Bids', ['auctionId', 'bidderId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Bids');
  },
};
