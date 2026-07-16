export interface ResolutionResult {
  hasWinner: boolean;
  winnerId?: bigint; // using bigint for compatibility with our PK
  amountPaid?: number;
  receiptMessage?: string;
}

/**
 * Strategy Pattern — AuctionResolutionStrategy.
 * Matches PDF specifications.
 */
export interface AuctionResolutionStrategy {
  /**
   * Evaluates bids to find the winner and determine the final price.
   */
  resolve(auctionId: bigint): Promise<ResolutionResult>;

  /**
   * Enforces rules when a participant submits a bid.
   */
  validateBid(auctionId: bigint, amount: number, basePrice: number): Promise<void>;
}
