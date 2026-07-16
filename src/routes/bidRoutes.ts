import { Router } from 'express';
import { placeBid, getBids } from '../controllers/bidController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { placeBidSchema } from '../schemas/bidSchema';

const router = Router({ mergeParams: true });

/**
 * POST /api/v1/auctions/:uuid/bids
 * Places a bid. Restricted to bid-participant role.
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRole('bid-participant'),
  validateRequest(placeBidSchema),
  placeBid
);

/**
 * GET /api/v1/auctions/:uuid/bids
 * Lists bids. Sealed-bid amounts hidden until auction is CLOSED.
 */
router.get('/', authenticateJWT, getBids);

export default router;
