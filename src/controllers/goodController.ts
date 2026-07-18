import { Request, Response } from 'express';
import { Good } from '../models/index';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler';
import { formatGood, formatGoodList } from '../views/goodView';
import { CreateGoodInput } from '../schemas/goodSchema';
import '../middleware/auth';

/**
 * POST /api/v1/goods
 * Creates a new catalog item. Restricted to bid-creator role.
 */
export const createGood = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, category, basePrice } = req.body as CreateGoodInput;
  const createdBy = req.user!.id;

  const good = await Good.create({ name, description, category, basePrice, createdBy });

  res.status(201).json({
    success: true,
    data: formatGood(good),
  });
});

/**
 * GET /api/v1/goods
 * Returns a paginated list of all catalog items. Accessible by all authenticated users.
 */
export const getGoods = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const offset = (page - 1) * limit;

  const { count, rows } = await Good.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: formatGoodList(rows),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

/**
 * GET /api/v1/goods/:uuid
 * Returns a single catalog item by its public UUID.
 */
export const getGoodByUuid = asyncHandler(async (req: Request, res: Response) => {
  const { uuid } = req.params;

  const good = await Good.findOne({ where: { uuid } });
  if (!good) {
    throw new NotFoundError('Good not found');
  }

  res.json({ success: true, data: formatGood(good) });
});
