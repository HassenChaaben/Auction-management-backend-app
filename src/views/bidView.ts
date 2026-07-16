import { BidAttributes } from '../models/Bid';

/**
 * Bid View — handles public English bids vs hidden Sealed-Bid auctions.
 * For SEALED_BID auctions, bid amounts and bidder info are hidden until the auction is CLOSED.
 */
export interface BidPublicDTO {
  uuid: string;
  amount: number | null;  // null for sealed bids while auction is running
  bidderUuid?: string | null;
  createdAt?: Date;
}

export function formatBid(
  bid: Partial<BidAttributes> & { bidder?: { uuid?: string } },
  isSealed: boolean
): BidPublicDTO {
  return {
    uuid: (bid as any).uuid!,
    amount: isSealed ? null : Number(bid.amount),
    bidderUuid: isSealed ? null : bid.bidder?.uuid ?? null,
    createdAt: bid.createdAt,
  };
}

export function formatBidList(
  bids: Array<Partial<BidAttributes> & { bidder?: { uuid?: string } }>,
  isSealed: boolean
): BidPublicDTO[] {
  return bids.map((b) => formatBid(b, isSealed));
}
