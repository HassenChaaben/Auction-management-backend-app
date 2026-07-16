import { Auction } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';

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
    // Winner resolution is handled by AuctionResolutionFacade
    await auction.update({ state: 'CLOSED' });
  }

  async cancel(auction: Auction): Promise<void> {
    await auction.update({ state: 'CANCELLED' });
  }

  canBid(): boolean {
    return true;
  }
}
