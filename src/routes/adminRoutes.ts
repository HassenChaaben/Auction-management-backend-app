import { Router } from 'express';
import { rechargeWallet } from '../controllers/walletController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { rechargeWalletSchema } from '../schemas/walletSchema';

const router = Router();

import { getAdminStatistics } from '../controllers/auctionController';

/**
 * POST /api/v1/admin/wallet/recharge
 * Recharges a user's wallet balance. Restricted to admin role.
 */
router.post(
  '/wallet/recharge',
  authenticateJWT,
  authorizeRole('admin'),
  validateRequest(rechargeWalletSchema),
  rechargeWallet
);

/**
 * GET /api/v1/admin/statistics
 * Returns aggregations and participant metrics. Restricted to admin role.
 */
router.get(
  '/statistics',
  authenticateJWT,
  authorizeRole('admin'),
  getAdminStatistics
);

export default router;
