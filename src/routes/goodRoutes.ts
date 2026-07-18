import { Router } from 'express';
import { createGood, getGoods, getGoodByUuid } from '../controllers/goodController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createGoodSchema } from '../schemas/goodSchema';

const router = Router();

/**
 * POST /api/v1/goods
 * Creates a catalog item. Restricted to bid-creator role only.
 */
router.post(
  '/',
  authenticateJWT,
  authorizeRole('bid-creator'),
  validateRequest(createGoodSchema),
  createGood
);

/**
 * GET /api/v1/goods
 * Lists all catalog items (authenticated users).
 */
router.get('/', getGoods);

/**
 * GET /api/v1/goods/:uuid
 * Returns a single catalog item by UUID.
 */
router.get('/:uuid', getGoodByUuid);

export default router;
