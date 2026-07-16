import { Auction } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';

/**
 * State Pattern — ClosedState.
 * A closed auction has concluded. No further state transitions or bidding allowed.
 */
export class ClosedState implements AuctionState {
  async schedule(_auction: Auction): Promise<void> {
    throw new AppError('Cannot schedule a CLOSED auction.', 409);
  }

  async start(_auction: Auction): Promise<void> {
    throw new AppError('Cannot start a CLOSED auction.', 409);
  }

  async close(_auction: Auction): Promise<void> {
    throw new AppError('Auction is already CLOSED.', 409);
  }

  async cancel(_auction: Auction): Promise<void> {
    throw new AppError('Cannot cancel a CLOSED auction.', 409);
  }

  async placeBid(_auction: Auction, _userId: bigint, _amount: number): Promise<void> {
    throw new AppError('Bidding is blocked: auction is closed.', 409);
  }
}
