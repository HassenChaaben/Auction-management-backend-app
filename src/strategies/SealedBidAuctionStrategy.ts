import { Bid } from '../models/index';
import { AuctionAttributes } from '../models/Auction';
import { AuctionResolutionStrategy } from './AuctionResolutionStrategy';

/**
 * Strategy Pattern — SealedBidAuctionStrategy.
 * Hidden (blind) bids. Bids are not visible to other participants until the auction closes.
 * Winner is determined by first-price rule: the highest bid wins and pays their full bid amount.
 * All bids must exceed the catalog starting price.
 */
export class SealedBidAuctionStrategy implements AuctionResolutionStrategy {
  /**
   * Resolves winner by finding the highest bid in the sealed pool.
   */
  async resolveWinner(auction: AuctionAttributes): Promise<Bid | null> {
    const winningBid = await Bid.findOne({
      where: { auctionId: auction.id },
      order: [['amount', 'DESC']],
    });
    return winningBid;
  }

  /**
   * Validates that the bid exceeds the starting price.
   * Does NOT compare with other bids (sealed bidding — bidders are blind).
   */
  async validateBid(
    auction: AuctionAttributes,
    bidAmount: number,
    _bidderId: bigint
  ): Promise<string | null> {
    if (bidAmount < Number(auction.startingPrice)) {
      return `Sealed bid must be at least the starting price of ${auction.startingPrice}`;
    }
    return null;
  }
}
