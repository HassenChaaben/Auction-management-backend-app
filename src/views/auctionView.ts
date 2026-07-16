import { AuctionAttributes } from '../models/Auction';

/**
 * Auction View — structures real-time auction lists and timers for API responses.
 */
export interface AuctionPublicDTO {
  uuid: string;
  goodUuid?: string;
  type: string;
  state: string;
  startingPrice: number;
  minimumIncrement: number;
  startAt: Date;
  endAt: Date;
  winnerId?: string | null;
  createdAt?: Date;
}

export function formatAuction(
  auction: Partial<AuctionAttributes> & { good?: { uuid?: string }; winner?: { uuid?: string } }
): AuctionPublicDTO {
  return {
    uuid: (auction as any).uuid!,
    goodUuid: auction.good?.uuid,
    type: auction.type!,
    state: auction.state!,
    startingPrice: Number(auction.startingPrice),
    minimumIncrement: Number(auction.minimumIncrement),
    startAt: auction.startAt!,
    endAt: auction.endAt!,
    winnerId: auction.winner?.uuid ?? null,
    createdAt: auction.createdAt,
  };
}

export function formatAuctionList(
  auctions: Array<Partial<AuctionAttributes> & { good?: { uuid?: string }; winner?: { uuid?: string } }>
): AuctionPublicDTO[] {
  return auctions.map(formatAuction);
}
