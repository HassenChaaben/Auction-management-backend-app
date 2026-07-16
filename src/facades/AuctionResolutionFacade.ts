import { sequelize } from '../config/database';
import { Auction, Bid, Wallet, Receipt, Good, User } from '../models/index';
import { AuctionStrategyFactory } from '../factories/AuctionStrategyFactory';
import { wsManager } from '../socket/WebSocketManager';
import { getAuctionState } from '../states/AuctionState';
import { formatAuction } from '../views/auctionView';
import { AppError } from '../middleware/errorHandler';

export class AuctionResolutionFacade {
  /**
   * Closes an auction and resolves the winner in a single transaction.
   * Deducts the winning bid amount from the winner's wallet and creates a receipt.
   */
  public static async closeAndResolve(auction: Auction): Promise<void> {
    // If the auction is already closed, do nothing
    if (auction.state === 'CLOSED') {
      return;
    }

    const strategy = AuctionStrategyFactory.getStrategy(auction.type);

    await sequelize.transaction(async (transaction) => {
      // 1. Transition state to CLOSED using the State Pattern logic
      // Note: We update the state in DB inside the transaction
      await auction.update({ state: 'CLOSED' }, { transaction });

      // 2. Resolve winner using strategy
      const winningBid = await strategy.resolveWinner(auction);

      if (winningBid) {
        const bidderId = winningBid.bidderId;
        const bidAmount = Number(winningBid.amount);

        // Deduct from bidder's wallet
        const wallet = await Wallet.findOne({
          where: { userId: bidderId },
          transaction,
          lock: transaction.LOCK.UPDATE, // Lock row for safety
        });

        if (!wallet) {
          throw new AppError('Winner wallet not found during resolution', 500);
        }

        if (Number(wallet.balance) < bidAmount) {
          // If balance is depleted or insufficient, we throw to abort the transaction
          // Note: In real life we'd want to handle this or lock balance at bid time, 
          // but per specification we enforce it here and fail the award transaction.
          throw new AppError('Winner has insufficient wallet balance at resolution time', 400);
        }

        // Deduct balance
        const newBalance = Number(wallet.balance) - bidAmount;
        await wallet.update({ balance: newBalance }, { transaction });

        // Create Receipt record
        const receipt = await Receipt.create(
          {
            auctionId: auction.id,
            winnerId: bidderId,
            bidId: winningBid.id,
            goodId: auction.goodId,
            amountPaid: bidAmount,
            awardedAt: new Date(),
          },
          { transaction }
        );

        // Update Auction winner & winning bid references
        await auction.update(
          {
            winnerId: bidderId,
            winningBidId: winningBid.id,
          },
          { transaction }
        );

        // Commit transaction happens automatically when callback resolves

        // Trigger websocket notifications outside/after transaction but we can schedule it:
        // We'll broadcast after transaction finishes.
      } else {
        // No winner (no bids placed)
        await auction.update(
          {
            winnerId: null,
            winningBidId: null,
          },
          { transaction }
        );
      }
    });

    // Reload auction to get all updated relations and values
    const updatedAuction = await Auction.findOne({
      where: { id: auction.id },
      include: [
        { model: Good, as: 'good' },
        { model: User, as: 'winner', attributes: ['uuid', 'username'] },
      ],
    });

    const publicAuction = formatAuction(updatedAuction as any);

    if (updatedAuction?.winnerId) {
      // Broadcast AWARD_COMPLETED
      wsManager.broadcastToAuction(
        updatedAuction.uuid,
        'AWARD_COMPLETED',
        {
          auction: publicAuction,
          winnerUuid: updatedAuction.winner?.uuid,
          amountPaid: Number(updatedAuction.startingPrice), // starting price or winning bid
        }
      );
    } else {
      // Broadcast AUCTION_CLOSE
      wsManager.broadcastToAuction(
        updatedAuction!.uuid,
        'AUCTION_CLOSE',
        {
          auction: publicAuction,
          message: 'Auction closed with no winner',
        }
      );
    }
  }
}
