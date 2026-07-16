import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Wallet } from '../models/index';
import { asyncHandler, ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { formatUserProfile } from '../views/userView';
import { RegisterInput, LoginInput } from '../schemas/authSchema';

/**
 * POST /api/v1/auth/register
 * Creates a new user with a linked wallet.
 * Wallet is created automatically with a zero balance (participants can be recharged by admin).
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body as RegisterInput;

  // Check for existing user
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({ username, email, password: hashedPassword, role });

  // Create associated Wallet (initial balance 0 — admin can recharge)
  await Wallet.create({ userId: user.id, balance: 0 });

  res.status(201).json({
    success: true,
    data: formatUserProfile(user),
  });
});

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns an RS256-signed JWT.
 * JWT payload contains ONLY { id, role } — per spec.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const privateKey = (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'];

  // JWT payload: ONLY user metadata — no balance, no email, no password hash
  const token = jwt.sign(
    { id: user.id.toString(), role: user.role },
    privateKey,
    { algorithm: 'RS256', expiresIn }
  );

  res.json({
    success: true,
    data: {
      token,
      user: formatUserProfile(user),
    },
  });
});
