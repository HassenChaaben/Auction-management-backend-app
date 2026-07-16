import { Router } from 'express';
import { getBalance, rechargeWallet } from '../controllers/walletController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { rechargeWalletSchema } from '../schemas/walletSchema';

const router = Router();

/**
 * GET /api/v1/wallet/balance
 * Returns current balance. Restricted to bid-participant role.
 */
router.get(
  '/balance',
  authenticateJWT,
  authorizeRole('bid-participant'),
  getBalance
);

/**
 * POST /api/v1/wallet/recharge (mounted under admin routes or wallet routes, let's mount it at /api/v1/admin/wallet/recharge)
 * Recharges a user's wallet. Restricted to admin role.
 */
// We can define it here and mount the router appropriately, or handle it here.
// Let's create a dedicated admin router or mount it in app.ts. We can just export multiple routes or mount it here.
// Actually, let's keep all wallet routes in walletRoutes and route them.
// To keep paths clean:
// GET /api/v1/wallet/balance -> router.get('/balance', ...)
// We will export this router and mount it at app.ts /api/v1/wallet.
// And we can have a separate admin router for GET /api/v1/admin/wallet/recharge. Or we can define it in walletRoutes and mount it under /api/v1/admin/wallet/recharge.
// Let's export two routers or a single one. Let's make a dedicated adminRoutes for admin-specific endpoints, since we will also have admin statistics later.

export default router;
