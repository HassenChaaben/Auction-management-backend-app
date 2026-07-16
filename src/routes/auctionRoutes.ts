import { Router } from 'express';
import {
  createAuction,
  getAuctions,
  getAuctionByUuid,
  updateAuctionState,
  downloadReceipt,
} from '../controllers/auctionController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createAuctionSchema, updateAuctionStateSchema } from '../schemas/auctionSchema';

const router = Router();

/**
 * POST /api/v1/auctions — create an auction (bid-creator or admin)
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRole('bid-creator', 'admin'),
  validateRequest(createAuctionSchema),
  createAuction
);

/**
 * GET /api/v1/auctions — list auctions with optional ?state= and ?type= filters
 */
router.get('/', authenticateJWT, getAuctions);

/**
 * GET /api/v1/auctions/:uuid — get single auction by UUID
 */
router.get('/:uuid', authenticateJWT, getAuctionByUuid);

/**
 * PATCH /api/v1/auctions/:uuid/state — trigger state transitions
 */
router.patch(
  '/:uuid/state',
  authenticateJWT,
  validateRequest(updateAuctionStateSchema),
  updateAuctionState
);

/**
 * GET /api/v1/auctions/:uuid/receipt — download PDF receipt
 */
router.get('/:uuid/receipt', authenticateJWT, downloadReceipt);

export default router;
