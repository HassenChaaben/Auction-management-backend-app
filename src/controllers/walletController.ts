import { Request, Response } from 'express';
import { Wallet, User } from '../models/index';
import { asyncHandler, NotFoundError, UnauthorizedError } from '../middleware/errorHandler';
import { RechargeWalletInput } from '../schemas/walletSchema';

/**
 * GET /api/v1/wallet/balance
 * Returns the balance of the authenticated user's wallet.
 * Restricted to bid-participants (or anyone authenticated). Spec says: (bid-participants only)
 */
export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const wallet = await Wallet.findOne({ where: { userId } });
  if (!wallet) {
    throw new NotFoundError('Wallet not found for this user');
  }

  res.json({
    success: true,
    data: {
      uuid: wallet.uuid,
      balance: Number(wallet.balance),
    },
  });
});

/**
 * POST /api/v1/admin/wallet/recharge
 * Recharges a user's wallet balance.
 * Restricted to admin role.
 */
export const rechargeWallet = asyncHandler(async (req: Request, res: Response) => {
  const { userUuid, amount } = req.body as RechargeWalletInput;

  const user = await User.findOne({ where: { uuid: userUuid } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const wallet = await Wallet.findOne({ where: { userId: user.id } });
  if (!wallet) {
    throw new NotFoundError('Wallet not found for this user');
  }

  // Recharge logic
  const newBalance = Number(wallet.balance) + amount;
  await wallet.update({ balance: newBalance });

  res.json({
    success: true,
    message: `Successfully recharged wallet for user ${user.username}`,
    data: {
      userUuid: user.uuid,
      username: user.username,
      newBalance,
    },
  });
});
