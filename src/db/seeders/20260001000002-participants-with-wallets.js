'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const participantPassword = await bcrypt.hash('Participant@123!', 12);

    const participants = Array.from({ length: 5 }, (_, i) => ({
      uuid: uuidv4(),
      username: `participant${i + 1}`,
      email: `participant${i + 1}@auction.com`,
      password: participantPassword,
      role: 'bid-participant',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert('Users', participants, {});

    // Retrieve inserted participant IDs
    const [inserted] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'bid-participant' ORDER BY id ASC LIMIT 5`
    );

    const wallets = inserted.map((user) => ({
      uuid: uuidv4(),
      userId: user.id,
      balance: 10000.00,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert('Wallets', wallets, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { role: 'bid-participant' }, {});
  },
};
