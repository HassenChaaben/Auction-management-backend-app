import { GoodAttributes } from '../models/Good';

/**
 * Good View — formats catalog listings and price fields.
 */
export interface GoodPublicDTO {
  uuid: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  createdAt?: Date;
}

export function formatGood(good: Partial<GoodAttributes>): GoodPublicDTO {
  return {
    uuid: good.uuid!,
    name: good.name!,
    description: good.description!,
    category: good.category!,
    basePrice: Number(good.basePrice),
    createdAt: good.createdAt,
  };
}

export function formatGoodList(goods: Partial<GoodAttributes>[]): GoodPublicDTO[] {
  return goods.map(formatGood);
}
