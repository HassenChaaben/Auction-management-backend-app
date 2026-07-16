import { Bid } from '../models/index';
import { AuctionAttributes } from '../models/Auction';

/**
 * Strategy Pattern — AuctionResolutionStrategy interface.
 * Defines the contract that all auction resolution strategies must implement.
 */
export interface AuctionResolutionStrategy {
  /**
   * Determines the winning bid for the given auction.
   * Returns the winning Bid instance or null if no valid bids exist.
   */
  resolveWinner(auction: AuctionAttributes): Promise<Bid | null>;

  /**
   * Validates whether a new bid is acceptable for the given auction.
   * Returns an error message string if invalid, or null if valid.
   */
  validateBid(auction: AuctionAttributes, bidAmount: number, bidderId: bigint): Promise<string | null>;
}
