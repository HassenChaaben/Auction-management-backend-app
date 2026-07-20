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
  winnerUsername?: string | null;
  createdAt?: Date;
}

export function formatAuction(
  auction: Partial<AuctionAttributes> & {
    good?: { uuid?: string };
    winner?: { uuid?: string; username?: string };
  }
): AuctionPublicDTO {
  // Base DTO response object containing fields common to all auction states
  const formatted: AuctionPublicDTO = {
    uuid: (auction as any).uuid!,
    goodUuid: auction.good?.uuid,
    type: auction.type!,
    state: auction.state!,
    startingPrice: Number(auction.startingPrice),
    minimumIncrement: Number(auction.minimumIncrement),
    startAt: auction.startAt!,
    endAt: auction.endAt!,
    createdAt: auction.createdAt,
  };

  // Winner information (winnerId & winnerUsername) is ONLY attached when the auction state is 'CLOSED'
  if (auction.state === 'CLOSED') {
    formatted.winnerId = auction.winner?.uuid ?? null;
    formatted.winnerUsername = auction.winner?.username ?? null;
  }

  return formatted;
}

export function formatAuctionList(
  auctions: Array<
    Partial<AuctionAttributes> & {
      good?: { uuid?: string };
      winner?: { uuid?: string; username?: string };
    }
  >
): AuctionPublicDTO[] {
  return auctions.map(formatAuction);
}
