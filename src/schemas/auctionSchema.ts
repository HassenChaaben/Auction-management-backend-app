import { z } from 'zod';

export const createAuctionSchema = z.object({
  goodUuid: z.string().uuid('Good UUID must be a valid UUID'),
  type: z.enum(['ENGLISH', 'SEALED_BID']),
  startingPrice: z.number().positive('Starting price must be positive'),
  minimumIncrement: z.number().positive('Minimum increment must be positive').optional().default(1),
  startAt: z.string().datetime('startAt must be a valid ISO datetime'),
  endAt: z.string().datetime('endAt must be a valid ISO datetime'),
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
  message: 'endAt must be after startAt',
  path: ['endAt'],
});

export const updateAuctionStateSchema = z.object({
  action: z.enum(['schedule', 'start', 'close', 'cancel']),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type UpdateAuctionStateInput = z.infer<typeof updateAuctionStateSchema>;
