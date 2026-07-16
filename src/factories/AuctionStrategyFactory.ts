import { AuctionResolutionStrategy } from '../strategies/AuctionResolutionStrategy';
import { EnglishAuctionStrategy } from '../strategies/EnglishAuctionStrategy';
import { SealedBidAuctionStrategy } from '../strategies/SealedBidAuctionStrategy';

/**
 * Simple Factory Pattern — AuctionStrategyFactory.
 * Resolves an auction type string to its concrete strategy instance.
 * Matches PDF specifications.
 */
export class AuctionStrategyFactory {
  private static strategies: Record<string, AuctionResolutionStrategy> = {
    'english': new EnglishAuctionStrategy(),
    'sealed_bid': new SealedBidAuctionStrategy(),
    'sealed-bid': new SealedBidAuctionStrategy(),
  };

  /**
   * Returns the strategy instance for the given auction type.
   * Throws if the type is unsupported.
   */
  static getStrategy(type: string): AuctionResolutionStrategy {
    // Normalise type checks to lowercase and replace dashes with underscores for flexibility
    const normalizedType = type.toLowerCase().replace('-', '_');
    const strategy = AuctionStrategyFactory.strategies[normalizedType];
    if (!strategy) {
      throw new Error(`Strategy type '${type}' is not supported.`);
    }
    return strategy;
  }
}
