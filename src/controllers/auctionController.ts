import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { Auction, Good, Receipt, User } from '../models/index';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { getAuctionState } from '../states/AuctionState';
import { formatAuction, formatAuctionList } from '../views/auctionView';
import { CreateAuctionInput, UpdateAuctionStateInput } from '../schemas/auctionSchema';
import { AuctionState } from '../models/Auction';
import { AuctionResolutionFacade } from '../facades/AuctionResolutionFacade';
import { generateReceiptPdf } from '../utils/pdf';

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
    case 'close':    await AuctionResolutionFacade.closeAndResolve(auction); break;
    case 'cancel':   await stateHandler.cancel(auction);   break;
  }

  await auction.reload();
  res.json({ success: true, data: formatAuction(auction as any) });
});

/**
 * GET /api/v1/auctions/:uuid/receipt
 * Downloads the PDF receipt for a closed auction.
 * Restricted to the winning participant and admin role.
 */
export const downloadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const userId = req.user!.id;
  const role = req.user!.role;

  const auction = await Auction.findOne({
    where: { uuid },
    include: [
      { model: Good, as: 'good' },
      { model: User, as: 'winner', attributes: ['id', 'uuid', 'username'] },
      { model: Receipt, as: 'receipt' },
    ],
  });

  if (!auction) {
    throw new NotFoundError('Auction not found');
  }

  if (auction.state !== 'CLOSED') {
    throw new ForbiddenError('Auction is not closed yet');
  }

  if (!auction.receipt) {
    throw new NotFoundError('No receipt generated for this auction');
  }

  // Access Control: Restricted to winning user and admin
  if (role !== 'admin' && auction.winnerId?.toString() !== userId.toString()) {
    throw new ForbiddenError('Access denied: You are not the winner of this auction');
  }

  // Generate PDF and stream it to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${auction.uuid}.pdf`);

  const pdfStream = generateReceiptPdf({
    auctionUuid: auction.uuid,
    goodName: auction.good?.name || 'Unknown Good',
    winnerUsername: auction.winner?.username || 'Unknown Winner',
    amountPaid: Number(auction.receipt.amountPaid),
    awardedAt: auction.receipt.awardedAt,
    transactionId: auction.receipt.transactionId,
  });

  pdfStream.pipe(res);
});

/**
 * GET /api/v1/admin/statistics
 * Returns admin analytics and statistics.
 * Filters: ?startDate=ISO & ?endDate=ISO
 */
export const getAdminStatistics = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  // Run raw query for participant metrics per auction type
  const query = `
    SELECT 
      a.type,
      COUNT(a.id)::int as "totalAuctions",
      COALESCE(AVG(sub.bidder_count), 0)::float as "avgParticipants",
      COALESCE(MIN(sub.bidder_count), 0)::int as "minParticipants",
      COALESCE(MAX(sub.bidder_count), 0)::int as "maxParticipants"
    FROM "Auctions" a
    LEFT JOIN (
      SELECT "auctionId", COUNT(DISTINCT "bidderId") as bidder_count
      FROM "Bids"
      GROUP BY "auctionId"
    ) sub ON a.id = sub."auctionId"
    WHERE a."createdAt" >= :startDate AND a."createdAt" <= :endDate
    GROUP BY a.type
  `;

  const metrics = await sequelize.query(query, {
    replacements: { startDate, endDate },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      timeframe: { startDate, endDate },
      metrics
    }
  });
});


