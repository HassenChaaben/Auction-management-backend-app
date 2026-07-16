import { z } from 'zod';

export const placeBidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
});

export type PlaceBidInput = z.infer<typeof placeBidSchema>;
