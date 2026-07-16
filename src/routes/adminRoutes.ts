import { Router } from 'express';
import { rechargeWallet } from '../controllers/walletController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { rechargeWalletSchema } from '../schemas/walletSchema';

const router = Router();

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

export default router;
