import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/authSchema';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Public — creates a new user account.
 */
router.post('/register', validateRequest(registerSchema), register);

/**
 * POST /api/v1/auth/login
 * Public — authenticates and returns a JWT.
 */
router.post('/login', validateRequest(loginSchema), login);

export default router;
