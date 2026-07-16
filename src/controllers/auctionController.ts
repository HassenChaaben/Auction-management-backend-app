import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Auction, Good } from '../models/index';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { getAuctionState } from '../states/AuctionState';
import { formatAuction, formatAuctionList } from '../views/auctionView';
import { CreateAuctionInput, UpdateAuctionStateInput } from '../schemas/auctionSchema';
import { AuctionState } from '../models/Auction';

/**
 * POST /api/v1/auctions
 * Creates a new auction in DRAFT state, linked to an existing Good.
 * Restricted to bid-creator role.
 */
export const createAuction = asyncHandler(async (req: Request, res: Response) => {
  const { goodUuid, type, startingPrice, minimumIncrement, startAt, endAt } =
    req.body as CreateAuctionInput;
  const createdBy = req.user!.id;

  const good = await Good.findOne({ where: { uuid: goodUuid } });
  if (!good) throw new NotFoundError('Good not found');

  const auction = await Auction.create({
    goodId: good.id,
    createdBy,
    type,
    state: 'DRAFT',
    startingPrice,
    minimumIncrement: minimumIncrement ?? 1,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    winnerId: null,
    winningBidId: null,
  });

  const result = await Auction.findOne({ where: { id: auction.id }, include: [{ model: Good, as: 'good' }] });

  res.status(201).json({ success: true, data: formatAuction(result as any) });
});

/**
 * GET /api/v1/auctions
 * Returns auctions filtered by optional ?state= query param.
 * All authenticated users can list auctions.
 */
export const getAuctions = asyncHandler(async (req: Request, res: Response) => {
  const { state, type } = req.query;
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (state) where.state = state;
  if (type) where.type = type;

  const { count, rows } = await Auction.findAndCountAll({
    where,
    include: [{ model: Good, as: 'good' }],
    order: [['startAt', 'DESC']],
    limit,
    offset,
  });

  res.json({
    success: true,
    data: formatAuctionList(rows as any[]),
    pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
  });
});

/**
 * GET /api/v1/auctions/:uuid
 * Returns a single auction by its public UUID.
 */
export const getAuctionByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;

  const auction = await Auction.findOne({
    where: { uuid },
    include: [{ model: Good, as: 'good' }],
  });
  if (!auction) throw new NotFoundError('Auction not found');

  res.json({ success: true, data: formatAuction(auction as any) });
});

/**
 * PATCH /api/v1/auctions/:uuid/state
 * Manually transitions the auction state.
 * Restricted to the auction creator or admin.
 */
export const updateAuctionState = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { action } = req.body as UpdateAuctionStateInput;

  const auction = await Auction.findOne({ where: { uuid } });
  if (!auction) throw new NotFoundError('Auction not found');

  // Only the creator or admin can change the state
  const userId = req.user!.id;
  const role = req.user!.role;
  if (role !== 'admin' && auction.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Only the auction creator or admin can change the state');
  }

  const stateHandler = getAuctionState(auction);

  switch (action) {
    case 'schedule': await stateHandler.schedule(auction); break;
    case 'start':    await stateHandler.start(auction);    break;
    case 'close':    await stateHandler.close(auction);    break;
    case 'cancel':   await stateHandler.cancel(auction);   break;
  }

  await auction.reload();
  res.json({ success: true, data: formatAuction(auction as any) });
});
