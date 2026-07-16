import { Request, Response } from 'express';
import { Auction, Bid, Wallet, User } from '../models/index';
import { asyncHandler, NotFoundError, UnauthorizedError, AppError } from '../middleware/errorHandler';
import { getAuctionState } from '../states/AuctionState';
import { AuctionStrategyFactory } from '../factories/AuctionStrategyFactory';
import { wsManager } from '../socket/WebSocketManager';
import { formatBidList } from '../views/bidView';
import { PlaceBidInput } from '../schemas/bidSchema';

/**
 * POST /api/v1/auctions/:uuid/bids
 * Places a bid on a running auction.
 * Validates wallet balance, auction state, and strategy-specific rules.
 * Returns 401 if wallet is depleted or insufficient (per spec requirement).
 */
export const placeBid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { amount } = req.body as PlaceBidInput;
  const bidderId = req.user!.id;

  const auction = await Auction.findOne({ where: { uuid } });
  if (!auction) throw new NotFoundError('Auction not found');

  // State validation — only RUNNING auctions accept bids
  const stateHandler = getAuctionState(auction);
  if (!stateHandler.canBid()) {
    throw new AppError(`Bids cannot be placed on a ${auction.state} auction`, 409);
  }

  // Wallet balance check — return 401 per spec if depleted or insufficient
  const wallet = await Wallet.findOne({ where: { userId: bidderId } });
  if (!wallet || Number(wallet.balance) <= 0 || Number(wallet.balance) < amount) {
    throw new UnauthorizedError('Insufficient wallet balance to place this bid');
  }

  // Strategy-specific validation
  const strategy = AuctionStrategyFactory.getStrategy(auction.type);
  const validationError = await strategy.validateBid(auction, amount, bidderId);
  if (validationError) {
    throw new AppError(validationError, 422);
  }

  // Create the bid
  const bid = await Bid.create({ auctionId: auction.id, bidderId, amount });

  // Broadcast PRICE_UPDATE event (skip for sealed bids — amount hidden)
  if (auction.type === 'ENGLISH') {
    wsManager.broadcastToAuction(uuid as string, 'PRICE_UPDATE', {
      auctionUuid: uuid as string,
      newHighestBid: amount,
      bidUuid: bid.uuid,
    });
  } else {
    wsManager.broadcastToAuction(uuid as string, 'NEW_BID', {
      auctionUuid: uuid as string,
      message: 'A new sealed bid has been placed',
    });
  }

  res.status(201).json({
    success: true,
    data: {
      uuid: bid.uuid,
      auctionUuid: uuid,
      amount: auction.type === 'SEALED_BID' ? undefined : amount,
      createdAt: bid.createdAt,
    },
  });
});

/**
 * GET /api/v1/auctions/:uuid/bids
 * Lists bids for an auction.
 * For SEALED_BID auctions: hides amounts and bidder info until state is CLOSED.
 */
export const getBids = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;

  const auction = await Auction.findOne({ where: { uuid } });
  if (!auction) throw new NotFoundError('Auction not found');

  // Sealed-bid: hide amounts unless the auction is closed
  const isSealed = auction.type === 'SEALED_BID' && auction.state !== 'CLOSED';

  const bids = await Bid.findAll({
    where: { auctionId: auction.id },
    include: [{ model: User, as: 'bidder', attributes: ['uuid', 'username'] }],
    order: [['createdAt', 'ASC']],
  });

  res.json({
    success: true,
    data: formatBidList(bids as any[], isSealed),
  });
});
