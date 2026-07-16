import { AuctionResolutionStrategy, ResolutionResult } from './AuctionResolutionStrategy';
import { Bid, Auction } from '../models/index';
import { AppError } from '../middleware/errorHandler';

/**
 * Strategy Pattern — SealedBidAuctionStrategy.
 * Sealed bid rules matching PDF specifications.
 */
export class SealedBidAuctionStrategy implements AuctionResolutionStrategy {
  async validateBid(_auctionId: bigint, amount: number, basePrice: number): Promise<void> {
    // For sealed bids, participants bid blindly.
    // We only check that the bid exceeds the catalog's starting basePrice.
    if (amount < basePrice) {
      throw new AppError(`Bid must exceed the catalog starting price of ${basePrice} tokens.`, 422);
    }
  }

  async resolve(auctionId: bigint): Promise<ResolutionResult> {
    // Collect all hidden bids
    const bids = await Bid.findAll({
      where: { auctionId },
      order: [
        ['amount', 'DESC'],
        ['createdAt', 'ASC'] // Tie-breaker: earliest bid wins (createdAt corresponds to bidTime)
      ]
    });

    if (bids.length === 0) {
      return { hasWinner: false, receiptMessage: "No bids were submitted." };
    }

    const winningBid = bids[0];
    const auction = await Auction.findByPk(auctionId);
    const reservePrice = Number(auction?.startingPrice || 0);

    if (reservePrice && Number(winningBid.amount) < reservePrice) {
      return { hasWinner: false, receiptMessage: "Top secret bid did not reach the reserve price." };
    }

    return {
      hasWinner: true,
      winnerId: winningBid.bidderId,
      amountPaid: Number(winningBid.amount), // First-price rule
      receiptMessage: `Won Sealed-Bid Auction at first-price value of ${winningBid.amount} tokens.`
    };
  }
}
