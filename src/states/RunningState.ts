import { Auction, Good } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';
import { sequelize } from '../config/database';

/**
 * State Pattern — RunningState.
 * An auction in RUNNING state accepts bids and can be closed or cancelled.
 * This is the ONLY state where bidding is allowed.
 */
export class RunningState implements AuctionState {
  async schedule(_auction: Auction): Promise<void> {
    throw new AppError('Cannot schedule a RUNNING auction.', 409);
  }

  async start(_auction: Auction): Promise<void> {
    throw new AppError('Auction is already RUNNING.', 409);
  }

  async close(auction: Auction): Promise<void> {
    await auction.update({ state: 'CLOSED' });
  }

  async cancel(auction: Auction): Promise<void> {
    await sequelize.transaction(async (transaction) => {
      await auction.update({ state: 'CANCELLED' }, { transaction });
      await Good.update({ isAvailable: true }, { where: { id: auction.goodId }, transaction });
    });
  }

  async placeBid(auction: Auction, userId: bigint, amount: number): Promise<void> {
    const { Wallet, Bid } = require('../models/index');
    const { AuctionStrategyFactory } = require('../factories/AuctionStrategyFactory');

    // 1. Verify Wallet Credit
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet || Number(wallet.balance) < amount) {
      throw new AppError('Insufficient wallet tokens.', 401);
    }

    // 2. Validate strategy-specific bid rules
    const strategy = AuctionStrategyFactory.getStrategy(auction.type);
    await strategy.validateBid(auction.id, amount, Number(auction.startingPrice));

    // 3. Create Bid
    await Bid.create({
      auctionId: auction.id,
      bidderId: userId,
      amount: amount
    });
  }
}
