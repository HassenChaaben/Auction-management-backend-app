import { AuctionType } from '../models/Auction';
import { AuctionResolutionStrategy } from '../strategies/AuctionResolutionStrategy';
import { EnglishAuctionStrategy } from '../strategies/EnglishAuctionStrategy';
import { SealedBidAuctionStrategy } from '../strategies/SealedBidAuctionStrategy';

/**
 * Simple Factory Pattern — AuctionStrategyFactory.
 * Resolves an auction type string to its concrete strategy instance.
 */
export class AuctionStrategyFactory {
  private static strategyMap: Map<AuctionType, AuctionResolutionStrategy> = new Map([
    ['ENGLISH', new EnglishAuctionStrategy()],
    ['SEALED_BID', new SealedBidAuctionStrategy()],
  ]);

  /**
   * Returns the strategy instance for the given auction type.
   * Throws if the type is unsupported.
   */
  static getStrategy(type: AuctionType): AuctionResolutionStrategy {
    const strategy = AuctionStrategyFactory.strategyMap.get(type);
    if (!strategy) {
      throw new Error(`Unsupported auction type: ${type}`);
    }
    return strategy;
  }
}
