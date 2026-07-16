'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Retrieve existing users for seeding
    const [creators] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'bid-creator' ORDER BY id ASC LIMIT 2`
    );
    const [participants] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'bid-participant' ORDER BY id ASC LIMIT 3`
    );

    if (creators.length === 0 || participants.length === 0) {
      console.warn('Missing creators or participants — skipping auction/bid seed.');
      return;
    }

    const creatorId = creators[0].id;
    const now = new Date();
    const past1h = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const past2h = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const past3h = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const future1h = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // Seed 2 goods
    const goods = [
      {
        uuid: uuidv4(),
        name: 'Vintage Oil Painting',
        description: 'A rare 19th-century oil painting depicting a Mediterranean landscape.',
        category: 'Art',
        basePrice: 500.00,
        createdBy: creatorId,
        createdAt: past3h,
        updatedAt: past3h,
      },
      {
        uuid: uuidv4(),
        name: 'Swiss Mechanical Watch',
        description: 'Luxury Swiss-made mechanical watch with sapphire crystal.',
        category: 'Watches',
        basePrice: 1200.00,
        createdBy: creatorId,
        createdAt: past3h,
        updatedAt: past3h,
      },
    ];

    await queryInterface.bulkInsert('Goods', goods, {});

    const [insertedGoods] = await queryInterface.sequelize.query(
      `SELECT id FROM "Goods" ORDER BY id ASC LIMIT 2`
    );

    // Seed 1 CLOSED auction (English) + 1 RUNNING auction (Sealed-Bid)
    const auctions = [
      {
        uuid: uuidv4(),
        goodId: insertedGoods[0].id,
        createdBy: creatorId,
        type: 'ENGLISH',
        state: 'CLOSED',
        startingPrice: 500.00,
        minimumIncrement: 50.00,
        startAt: past3h,
        endAt: past1h,
        winnerId: participants[0].id,
        winningBidId: null,
        createdAt: past3h,
        updatedAt: past1h,
      },
      {
        uuid: uuidv4(),
        goodId: insertedGoods[1].id,
        createdBy: creatorId,
        type: 'SEALED_BID',
        state: 'RUNNING',
        startingPrice: 1200.00,
        minimumIncrement: 100.00,
        startAt: past2h,
        endAt: future1h,
        winnerId: null,
        winningBidId: null,
        createdAt: past2h,
        updatedAt: past2h,
      },
    ];

    await queryInterface.bulkInsert('Auctions', auctions, {});

    const [insertedAuctions] = await queryInterface.sequelize.query(
      `SELECT id FROM "Auctions" ORDER BY id ASC LIMIT 2`
    );

    // Seed bids for the closed English auction
    const bids = [
      {
        uuid: uuidv4(),
        auctionId: insertedAuctions[0].id,
        bidderId: participants[0].id,
        amount: 550.00,
        createdAt: past2h,
        updatedAt: past2h,
      },
      {
        uuid: uuidv4(),
        auctionId: insertedAuctions[0].id,
        bidderId: participants[1].id,
        amount: 620.00,
        createdAt: past2h,
        updatedAt: past2h,
      },
      {
        uuid: uuidv4(),
        auctionId: insertedAuctions[0].id,
        bidderId: participants[0].id,
        amount: 700.00,
        createdAt: past1h,
        updatedAt: past1h,
      },
    ];

    await queryInterface.bulkInsert('Bids', bids, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Bids', null, {});
    await queryInterface.bulkDelete('Auctions', null, {});
    await queryInterface.bulkDelete('Goods', null, {});
  },
};
