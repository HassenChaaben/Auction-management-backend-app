import { Auction } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';

/**
 * State Pattern — CancelledState.
 * A cancelled auction is a terminal state. No further transitions allowed.
 */
export class CancelledState implements AuctionState {
  async schedule(_auction: Auction): Promise<void> {
    throw new AppError('Cannot schedule a CANCELLED auction.', 409);
  }

  async start(_auction: Auction): Promise<void> {
    throw new AppError('Cannot start a CANCELLED auction.', 409);
  }

  async close(_auction: Auction): Promise<void> {
    throw new AppError('Cannot close a CANCELLED auction.', 409);
  }

  async cancel(_auction: Auction): Promise<void> {
    throw new AppError('Auction is already CANCELLED.', 409);
  }

  async placeBid(_auction: Auction, _userId: bigint, _amount: number): Promise<void> {
    throw new AppError('Bidding is blocked: auction is cancelled.', 409);
  }
}
