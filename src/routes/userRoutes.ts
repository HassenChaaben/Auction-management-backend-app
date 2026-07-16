import { Router } from 'express';
import { getMyAuctions, getMySpending } from '../controllers/authController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/users/me/auctions
 * Returns participant history for logged-in user. Restricted to bid-participants (or anyone authenticated).
 */
router.get(
  '/me/auctions',
  authenticateJWT,
  authorizeRole('bid-participant', 'admin'),
  getMyAuctions
);

/**
 * GET /api/v1/users/me/spending
 * Aggregate user spending over a timeframe. Restricted to bid-participants (or anyone authenticated).
 */
router.get(
  '/me/spending',
  authenticateJWT,
  authorizeRole('bid-participant', 'admin'),
  getMySpending
);

export default router;
