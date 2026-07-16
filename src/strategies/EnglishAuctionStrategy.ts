import { AuctionResolutionStrategy, ResolutionResult } from './AuctionResolutionStrategy';
import { Bid, Auction } from '../models/index';
import { AppError } from '../middleware/errorHandler';

/**
 * Strategy Pattern — EnglishAuctionStrategy.
 * Open ascending bidding rules matching PDF specifications.
 */
export class EnglishAuctionStrategy implements AuctionResolutionStrategy {
  async validateBid(auctionId: bigint, amount: number, basePrice: number): Promise<void> {
    // Find the current highest bid
    const highestBid = await Bid.findOne({
      where: { auctionId },
      order: [['amount', 'DESC']]
    });

    // Get minimum increment rule from Auction model
    const auction = await Auction.findByPk(auctionId);
    const minIncrement = Number(auction?.minimumIncrement || 0);
    const reservePrice = Number(auction?.startingPrice || basePrice);

    // If no bids yet, first bid must at least equal the reserve/starting price
    const minRequired = highestBid 
      ? Number(highestBid.amount) + minIncrement 
      : reservePrice;

    if (amount < minRequired) {
      throw new AppError(`Bid amount must be at least ${minRequired} tokens.`, 422);
    }
  }

  async resolve(auctionId: bigint): Promise<ResolutionResult> {
    // Winner is the highest bidder
    const winningBid = await Bid.findOne({
      where: { auctionId },
      order: [['amount', 'DESC']]
    });

    if (!winningBid) {
      return { hasWinner: false, receiptMessage: "No bids were placed on this auction." };
    }

    const auction = await Auction.findByPk(auctionId);
    const reservePrice = Number(auction?.startingPrice || 0);

    // Check if highest bid met the optional reserve price
    if (reservePrice && Number(winningBid.amount) < reservePrice) {
      return { hasWinner: false, receiptMessage: "Highest bid failed to meet reserve price." };
    }

    return {
      hasWinner: true,
      winnerId: winningBid.bidderId,
      amountPaid: Number(winningBid.amount),
      receiptMessage: `Won English Auction with highest bid of ${winningBid.amount} tokens.`
    };
  }
}
