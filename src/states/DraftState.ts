import { Auction } from '../models/index';
import { AuctionState } from './AuctionState';
import { AppError } from '../middleware/errorHandler';

/**
 * State Pattern — DraftState.
 * An auction in DRAFT state can be scheduled or cancelled.
 * Bidding is NOT allowed.
 */
export class DraftState implements AuctionState {
  async schedule(auction: Auction): Promise<void> {
    await auction.update({ state: 'SCHEDULED' });
  }

  async start(_auction: Auction): Promise<void> {
    throw new AppError('Cannot start an auction that is still in DRAFT state. Schedule it first.', 409);
  }

  async close(_auction: Auction): Promise<void> {
    throw new AppError('Cannot close a DRAFT auction.', 409);
  }

  async cancel(auction: Auction): Promise<void> {
    await auction.update({ state: 'CANCELLED' });
  }

  canBid(): boolean {
    return false;
  }
}
