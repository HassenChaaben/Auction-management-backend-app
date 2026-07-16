import { Auction } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';

/**
 * State Pattern — ScheduledState.
 * A scheduled auction is waiting for its startAt time.
 * Can be started (by cron or manually) or cancelled.
 */
export class ScheduledState implements AuctionState {
  async schedule(_auction: Auction): Promise<void> {
    throw new AppError('Auction is already scheduled.', 409);
  }

  async start(auction: Auction): Promise<void> {
    await auction.update({ state: 'RUNNING' });
  }

  async close(_auction: Auction): Promise<void> {
    throw new AppError('Cannot close a SCHEDULED auction. It must be RUNNING first.', 409);
  }

  async cancel(auction: Auction): Promise<void> {
    await auction.update({ state: 'CANCELLED' });
  }

  async placeBid(_auction: Auction, _userId: bigint, _amount: number): Promise<void> {
    throw new AppError('Bidding is blocked: auction is not running.', 409);
  }
}
