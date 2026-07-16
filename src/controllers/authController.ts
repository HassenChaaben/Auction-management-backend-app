import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Wallet, Auction, Bid, Good, Receipt } from '../models/index';
import { asyncHandler, ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { formatUserProfile } from '../views/userView';
import { formatAuctionList } from '../views/auctionView';
import { RegisterInput, LoginInput } from '../schemas/authSchema';

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body as RegisterInput;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, password: hashedPassword, role });
  await Wallet.create({ userId: user.id, balance: 0 });

  res.status(201).json({
    success: true,
    data: formatUserProfile(user),
  });
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const privateKey = (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'];

  const token = jwt.sign(
    { id: user.id.toString(), role: user.role },
    privateKey,
    { algorithm: 'RS256', expiresIn }
  );

  res.json({
    success: true,
    data: {
      token,
      user: formatUserProfile(user),
    },
  });
});

/**
 * GET /api/v1/users/me/auctions
 * Returns participant history for the logged-in user.
 * Filters: ?filter=[all|won|lost] & ?startDate=ISO & ?endDate=ISO
 */
export const getMyAuctions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { filter, startDate, endDate } = req.query;

  // Find all auctions the user bid on
  const userBids = await Bid.findAll({
    where: { bidderId: userId },
    attributes: ['auctionId'],
  });
  const bidAuctionIds = Array.from(new Set(userBids.map((b) => b.auctionId)));

  const whereClause: any = {};

  // Date range filtering
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      whereClause.createdAt[Op.lte] = new Date(endDate as string);
    }
  }

  if (filter === 'won') {
    whereClause.winnerId = userId;
    whereClause.state = 'CLOSED';
  } else if (filter === 'lost') {
    whereClause.id = { [Op.in]: bidAuctionIds };
    whereClause.winnerId = { [Op.ne]: userId };
    whereClause.state = 'CLOSED';
  } else {
    // default/all: auctions bid on OR won
    whereClause[Op.or] = [
      { id: { [Op.in]: bidAuctionIds } },
      { winnerId: userId },
    ];
  }

  const auctions = await Auction.findAll({
    where: whereClause,
    include: [{ model: Good, as: 'good' }],
    order: [['endAt', 'DESC']],
  });

  res.json({
    success: true,
    data: formatAuctionList(auctions as any[]),
  });
});

/**
 * GET /api/v1/users/me/spending
 * Aggregate user spending over a timeframe.
 * Filters: ?startDate=ISO & ?endDate=ISO
 */
export const getMySpending = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const whereClause: any = { winnerId: userId };

  if (startDate || endDate) {
    whereClause.awardedAt = {};
    if (startDate) {
      whereClause.awardedAt[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      whereClause.awardedAt[Op.lte] = new Date(endDate as string);
    }
  }

  const receipts = await Receipt.findAll({
    where: whereClause,
    include: [{ model: Good, as: 'good' }],
  });

  const totalSpending = receipts.reduce((sum, r) => sum + Number(r.amountPaid), 0);

  res.json({
    success: true,
    data: {
      totalSpending,
      receiptsCount: receipts.length,
      receipts: receipts.map((r) => ({
        uuid: r.uuid,
        goodName: (r as any).good?.name || 'Unknown Good',
        amountPaid: Number(r.amountPaid),
        awardedAt: r.awardedAt,
        transactionId: r.transactionId,
      })),
    },
  });
});
