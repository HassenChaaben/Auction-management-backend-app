import { Auction } from '../models/index';
import { AuctionAttributes } from '../models/Auction';

/**
 * State Pattern — AuctionState interface.
 * Each concrete state encapsulates behavior specific to that state,
 * enforcing valid transitions and operation constraints.
 */
export interface AuctionState {
  /**
   * Transition the auction to SCHEDULED state (from DRAFT).
   */
  schedule(auction: Auction): Promise<void>;

  /**
   * Transition the auction to RUNNING state (from SCHEDULED).
   */
  start(auction: Auction): Promise<void>;

  /**
   * Transition the auction to CLOSED state and trigger winner resolution.
   */
  close(auction: Auction): Promise<void>;

  /**
   * Transition the auction to CANCELLED state.
   */
  cancel(auction: Auction): Promise<void>;

  /**
   * Enforces rules and record a bid on a running auction.
   */
  placeBid(auction: Auction, userId: bigint, amount: number): Promise<void>;
}

/**
 * Returns the appropriate state handler for the given auction's current state.
 */
export function getAuctionState(auction: AuctionAttributes): AuctionState {
  // Lazy import to avoid circular dependencies
  const { DraftState } = require('./DraftState');
  const { ScheduledState } = require('./ScheduledState');
  const { RunningState } = require('./RunningState');
  const { ClosedState } = require('./ClosedState');
  const { CancelledState } = require('./CancelledState');

  switch (auction.state) {
    case 'DRAFT':      return new DraftState();
    case 'SCHEDULED':  return new ScheduledState();
    case 'RUNNING':    return new RunningState();
    case 'CLOSED':     return new ClosedState();
    case 'CANCELLED':  return new CancelledState();
    default:           throw new Error(`Unknown auction state: ${auction.state}`);
  }
}
