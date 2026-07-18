import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/config/database';
import jwt from 'jsonwebtoken';

async function runTests() {
  console.log('🚀 Starting end-to-end API test suite...');

  try {
    // 1. Force sync database to ensure clean state
    await sequelize.authenticate();
    console.log('🔌 Database connected. Cleaning tables...');
    await sequelize.sync({ force: true });
    console.log('🧹 Tables cleared.');

    let creatorToken = '';
    let participantToken = '';
    let adminToken = '';
    let goodUuid = '';
    let auctionUuid = '';

    // Register Creator
    console.log('\n--- 1. Testing User Registration ---');
    const regCreatorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'auctioncreator',
        email: 'creator@example.com',
        password: 'Password1',
        role: 'bid-creator'
      });
    if (regCreatorRes.status !== 201) {
      throw new Error(`Creator registration failed: ${JSON.stringify(regCreatorRes.body)}`);
    }
    console.log('✓ Bid Creator registered successfully.');

    // Register Participant
    const regParticipantRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'bidder1',
        email: 'bidder1@example.com',
        password: 'Password1',
        role: 'bid-participant'
      });
    if (regParticipantRes.status !== 201) {
      throw new Error(`Participant registration failed: ${JSON.stringify(regParticipantRes.body)}`);
    }
    console.log('✓ Bid Participant registered successfully.');

    // Register Admin
    const regAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'sysadmin',
        email: 'admin@example.com',
        password: 'Password1',
        role: 'admin'
      });
    if (regAdminRes.status !== 201) {
      throw new Error(`Admin registration failed: ${JSON.stringify(regAdminRes.body)}`);
    }
    console.log('✓ Admin registered successfully.');

    // Login Creator
    console.log('\n--- 2. Testing User Login ---');
    const loginCreatorRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'creator@example.com',
        password: 'Password1'
      });
    creatorToken = `Bearer ${loginCreatorRes.body.data.token}`;
    console.log('✓ Bid Creator logged in. Received JWT.');

    // Login Participant
    const loginParticipantRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bidder1@example.com',
        password: 'Password1'
      });
    participantToken = `Bearer ${loginParticipantRes.body.data.token}`;
    console.log('✓ Bid Participant logged in. Received JWT.');

    // Login Admin
    const loginAdminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password1'
      });
    adminToken = `Bearer ${loginAdminRes.body.data.token}`;
    console.log('✓ Admin logged in. Received JWT.');

    // Recharge Wallet (Admin endpoint)
    console.log('\n--- 3. Testing Admin Wallet Recharge ---');
    const userUuid = regParticipantRes.body.data.uuid;
    const rechargeRes = await request(app)
      .post('/api/v1/admin/wallet/recharge')
      .set('Authorization', adminToken)
      .send({
        userUuid,
        amount: 500.00
      });
    if (rechargeRes.status !== 200) {
      throw new Error(`Recharge failed: ${JSON.stringify(rechargeRes.body)}`);
    }
    console.log(`✓ Recharged wallet for user by $500.00. Balance is now: $${rechargeRes.body.data.newBalance}`);

    // Check Balance (Participant endpoint)
    const checkBalanceRes = await request(app)
      .get('/api/v1/wallet/balance')
      .set('Authorization', participantToken);
    if (checkBalanceRes.status !== 200 || checkBalanceRes.body.data.balance !== 500) {
      throw new Error(`Check balance failed: ${JSON.stringify(checkBalanceRes.body)}`);
    }
    console.log(`✓ Wallet balance check verified: $${checkBalanceRes.body.data.balance}`);

    // Create Good
    console.log('\n--- 4. Testing Goods Catalog Creation ---');
    const goodRes = await request(app)
      .post('/api/v1/goods')
      .set('Authorization', creatorToken)
      .send({
        name: 'Vintage Rolex Submariner',
        description: 'Circa 1970 automatic dive watch, excellent condition.',
        category: 'Watches',
        basePrice: 200.00
      });
    if (goodRes.status !== 201) {
      throw new Error(`Good creation failed: ${JSON.stringify(goodRes.body)}`);
    }
    goodUuid = goodRes.body.data.uuid;
    console.log(`✓ Catalog item created: ${goodRes.body.data.name} (UUID: ${goodUuid})`);

    // Create Auction
    console.log('\n--- 5. Testing Auction Creation (Draft) ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const auctionRes = await request(app)
      .post('/api/v1/auctions')
      .set('Authorization', creatorToken)
      .send({
        goodUuid,
        type: 'ENGLISH',
        startingPrice: 250.00,
        minimumIncrement: 10.00,
        startAt: tomorrow.toISOString(),
        endAt: dayAfter.toISOString()
      });
    if (auctionRes.status !== 201) {
      throw new Error(`Auction creation failed: ${JSON.stringify(auctionRes.body)}`);
    }
    auctionUuid = auctionRes.body.data.uuid;
    console.log(`✓ English Auction created in DRAFT state. (UUID: ${auctionUuid})`);

    // State Transition: DRAFT -> SCHEDULED
    console.log('\n--- 6. Testing Auction State Transitions ---');
    const scheduleRes = await request(app)
      .patch(`/api/v1/auctions/${auctionUuid}/state`)
      .set('Authorization', creatorToken)
      .send({ action: 'schedule' });
    if (scheduleRes.status !== 200 || scheduleRes.body.data.state !== 'SCHEDULED') {
      throw new Error(`Failed to transition to SCHEDULED: ${JSON.stringify(scheduleRes.body)}`);
    }
    console.log('✓ State transition to SCHEDULED successful.');

    // State Transition: SCHEDULED -> RUNNING
    const startRes = await request(app)
      .patch(`/api/v1/auctions/${auctionUuid}/state`)
      .set('Authorization', creatorToken)
      .send({ action: 'start' });
    if (startRes.status !== 200 || startRes.body.data.state !== 'RUNNING') {
      throw new Error(`Failed to transition to RUNNING: ${JSON.stringify(startRes.body)}`);
    }
    console.log('✓ State transition to RUNNING successful. Bidding is now open.');

    // Place Bid: Valid Bid
    console.log('\n--- 7. Testing Bidding on Running Auction ---');
    const bid1Res = await request(app)
      .post(`/api/v1/auctions/${auctionUuid}/bids`)
      .set('Authorization', participantToken)
      .send({ amount: 260.00 });
    if (bid1Res.status !== 201) {
      throw new Error(`Failed to place valid bid 1: ${JSON.stringify(bid1Res.body)}`);
    }
    console.log('✓ Placed valid bid of $260.00.');

    // Place Bid: Invalid Bid (under minimum increment)
    const bid2Res = await request(app)
      .post(`/api/v1/auctions/${auctionUuid}/bids`)
      .set('Authorization', participantToken)
      .send({ amount: 265.00 }); // min is 260 + 10 = 270
    if (bid2Res.status !== 422) {
      throw new Error(`Expected bid validation error, got status ${bid2Res.status}: ${JSON.stringify(bid2Res.body)}`);
    }
    console.log('✓ Rejected invalid bid of $265.00 (below min increment of $10.00).');

    // Place Bid: Valid Higher Bid
    const bid3Res = await request(app)
      .post(`/api/v1/auctions/${auctionUuid}/bids`)
      .set('Authorization', participantToken)
      .send({ amount: 300.00 });
    if (bid3Res.status !== 201) {
      throw new Error(`Failed to place valid higher bid: ${JSON.stringify(bid3Res.body)}`);
    }
    console.log('✓ Placed valid higher bid of $300.00.');

    // Close and Resolve Auction
    console.log('\n--- 8. Testing Close & Winner Resolution ---');
    const closeRes = await request(app)
      .patch(`/api/v1/auctions/${auctionUuid}/state`)
      .set('Authorization', creatorToken)
      .send({ action: 'close' });
    if (closeRes.status !== 200 || closeRes.body.data.state !== 'CLOSED') {
      throw new Error(`Failed to close auction: ${JSON.stringify(closeRes.body)}`);
    }
    console.log(`✓ Auction closed and winner resolved successfully. Winner UUID: ${closeRes.body.data.winnerId}`);

    // Verify Wallet balance is deducted by $300.00 (original balance $500.00 -> should be $200.00)
    console.log('\n--- 9. Verifying Post-Resolution Wallet Balances ---');
    const finalBalanceRes = await request(app)
      .get('/api/v1/wallet/balance')
      .set('Authorization', participantToken);
    if (finalBalanceRes.body.data.balance !== 200) {
      throw new Error(`Wallet balance expected to be 200, got: ${finalBalanceRes.body.data.balance}`);
    }
    console.log(`✓ Wallet balance correctly deducted. New balance: $${finalBalanceRes.body.data.balance}`);

    // Download Receipt (Winning bidder)
    console.log('\n--- 10. Testing Receipt PDF Generation & Download ---');
    const receiptRes = await request(app)
      .get(`/api/v1/auctions/${auctionUuid}/receipt`)
      .set('Authorization', participantToken);
    if (receiptRes.status !== 200) {
      throw new Error(`Receipt download failed: ${JSON.stringify(receiptRes.body)}`);
    }
    if (receiptRes.headers['content-type'] !== 'application/pdf') {
      throw new Error(`Expected PDF Content-Type, got: ${receiptRes.headers['content-type']}`);
    }
    console.log('✓ Receipt PDF generated and downloaded successfully.');

    // Download Receipt (Non-winner, non-admin should fail)
    const unauthorizedReceiptRes = await request(app)
      .get(`/api/v1/auctions/${auctionUuid}/receipt`)
      .set('Authorization', creatorToken);
    if (unauthorizedReceiptRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-winner receipt access, got status ${unauthorizedReceiptRes.status}`);
    }
    console.log('✓ Correctly restricted receipt access to winner and admin only.');

    console.log('\n⭐ All End-to-End API Checks Passed Successfully! 100% Correct. ⭐\n');

  } catch (error) {
    console.error('\n❌ E2E API Verification Failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runTests();
