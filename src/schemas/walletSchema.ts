import { z } from 'zod';

export const rechargeWalletSchema = z.object({
  userUuid: z.string().uuid('User UUID must be a valid UUID'),
  amount: z.number().positive('Recharge amount must be positive'),
});

export type RechargeWalletInput = z.infer<typeof rechargeWalletSchema>;
