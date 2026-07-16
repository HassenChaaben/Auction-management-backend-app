import { ReceiptAttributes } from '../models/Receipt';

export interface ReceiptPublicDTO {
  uuid: string;
  auctionUuid?: string;
  winnerUsername?: string;
  goodName?: string;
  amountPaid: number;
  transactionId: string;
  awardedAt: Date;
}

/**
 * Formats a Receipt model database object to a safe JSON representation.
 */
export function formatReceipt(
  receipt: Partial<ReceiptAttributes> & {
    auction?: { uuid?: string };
    winner?: { username?: string };
    good?: { name?: string };
  }
): ReceiptPublicDTO {
  return {
    uuid: receipt.uuid!,
    auctionUuid: receipt.auction?.uuid,
    winnerUsername: receipt.winner?.username,
    goodName: receipt.good?.name,
    amountPaid: Number(receipt.amountPaid),
    transactionId: receipt.transactionId!,
    awardedAt: receipt.awardedAt!,
  };
}
