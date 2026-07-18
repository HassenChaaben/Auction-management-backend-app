import { sequelize } from '../config/database';
import { Auction, Bid, Wallet, Receipt, Good, User } from '../models/index';
import { AuctionStrategyFactory } from '../factories/AuctionStrategyFactory';
import { wsManager } from '../socket/WebSocketManager';
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
      // Lock the auction row in DB to prevent concurrent updates from multiple instances
      const lockedAuction = await Auction.findByPk(auction.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!lockedAuction || lockedAuction.state === 'CLOSED') {
        return;
      }

      // 1. Transition state to CLOSED
      await lockedAuction.update({ state: 'CLOSED' }, { transaction });

      // 2. Resolve winner using strategy
      const result = await strategy.resolve(lockedAuction.id);

      if (result.hasWinner && result.winnerId && result.amountPaid) {
        const bidderId = result.winnerId;
        const bidAmount = result.amountPaid;

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
          throw new AppError('Winner has insufficient wallet balance at resolution time', 400);
        }

        // Deduct balance
        const newBalance = Number(wallet.balance) - bidAmount;
        await wallet.update({ balance: newBalance }, { transaction });

        // Retrieve winning bid ID
        const winningBid = await Bid.findOne({
          where: { auctionId: lockedAuction.id, bidderId, amount: bidAmount },
          order: [['createdAt', 'DESC']],
          transaction
        });

        // Create Receipt record
        await Receipt.create(
          {
            auctionId: lockedAuction.id,
            winnerId: bidderId,
            bidId: winningBid!.id,
            goodId: lockedAuction.goodId,
            amountPaid: bidAmount,
            awardedAt: new Date(),
          },
          { transaction }
        );

        // Update Auction winner & winning bid references
        await lockedAuction.update(
          {
            winnerId: bidderId,
            winningBidId: winningBid!.id,
          },
          { transaction }
        );
      } else {
        // No winner (no bids placed)
        await lockedAuction.update(
          {
            winnerId: null,
            winningBidId: null,
          },
          { transaction }
        );
      }

      // Conclude Auction State & Release Catalog Item
      await Good.update({ isAvailable: true }, { where: { id: lockedAuction.goodId }, transaction });
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
      wsManager.broadcastToAuction(
        updatedAuction.uuid,
        'AWARD_COMPLETED',
        {
          auction: publicAuction,
          winnerUuid: (updatedAuction as any).winner?.uuid,
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
