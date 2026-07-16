import { z } from 'zod';

export const createGoodSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category is required').max(100),
  basePrice: z.number().positive('Base price must be positive'),
});

export type CreateGoodInput = z.infer<typeof createGoodSchema>;
