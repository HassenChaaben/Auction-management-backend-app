'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const adminPassword = await bcrypt.hash('Admin@123!', 12);
    const creatorPassword = await bcrypt.hash('Creator@123!', 12);

    const users = [
      {
        uuid: uuidv4(),
        username: 'admin',
        email: 'admin@auction.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: uuidv4(),
        username: 'creator1',
        email: 'creator1@auction.com',
        password: creatorPassword,
        role: 'bid-creator',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        uuid: uuidv4(),
        username: 'creator2',
        email: 'creator2@auction.com',
        password: creatorPassword,
        role: 'bid-creator',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { role: ['admin', 'bid-creator'] }, {});
  },
};
