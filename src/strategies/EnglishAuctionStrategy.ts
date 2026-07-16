import { Bid } from '../models/index';
import { AuctionAttributes } from '../models/Auction';
import { AuctionResolutionStrategy } from './AuctionResolutionStrategy';

/**
 * Strategy Pattern — EnglishAuctionStrategy.
 * Open ascending bids. The highest bidder wins and pays their bid amount.
 * A new bid must exceed the current highest bid + the auction's minimumIncrement.
 */
export class EnglishAuctionStrategy implements AuctionResolutionStrategy {
  /**
   * Resolves the winner by finding the highest bid for the auction.
   */
  async resolveWinner(auction: AuctionAttributes): Promise<Bid | null> {
    const winningBid = await Bid.findOne({
      where: { auctionId: auction.id },
      order: [['amount', 'DESC']],
    });
    return winningBid;
  }

  /**
   * Validates that the new bid exceeds currentHighest + minimumIncrement.
   * If it's the first bid, it must at least equal startingPrice.
   */
  async validateBid(
    auction: AuctionAttributes,
    bidAmount: number,
    _bidderId: bigint
  ): Promise<string | null> {
    const currentHighest = await Bid.findOne({
      where: { auctionId: auction.id },
      order: [['amount', 'DESC']],
    });

    if (!currentHighest) {
      // First bid must be at least the starting price
      if (bidAmount < Number(auction.startingPrice)) {
        return `Bid must be at least the starting price of ${auction.startingPrice}`;
      }
    } else {
      const minimumRequired = Number(currentHighest.amount) + Number(auction.minimumIncrement);
      if (bidAmount < minimumRequired) {
        return `Bid must exceed the current highest bid (${currentHighest.amount}) + minimum increment (${auction.minimumIncrement}). Minimum: ${minimumRequired}`;
      }
    }

    return null;
  }
}
