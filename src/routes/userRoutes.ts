import { Router } from 'express';
import { getMyAuctions, getMySpending } from '../controllers/authController';
import { getBalance } from '../controllers/walletController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/users/me/balance
 * Returns current wallet balance for the logged-in user. Restricted to bid-participant role.
 */
router.get(
  '/me/balance',
  authenticateJWT,
  authorizeRole('bid-participant'),
  getBalance
);

/**
 * GET /api/v1/users/me/auctions
 * Returns participant history for logged-in user. Restricted to bid-participant role.
 */
router.get(
  '/me/auctions',
  authenticateJWT,
  authorizeRole('bid-participant'),
  getMyAuctions
);

/**
 * GET /api/v1/users/me/spending
 * Aggregate user spending over a timeframe. Restricted to bid-participant role.
 */
router.get(
  '/me/spending',
  authenticateJWT,
  authorizeRole('bid-participant'),
  getMySpending
);

export default router;
