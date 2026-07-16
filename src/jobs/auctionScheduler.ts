import cron from 'node-cron';
import { Op } from 'sequelize';
import { Auction } from '../models/index';

/**
 * Background Scheduler — auctionScheduler.
 *
 * Runs two cron jobs:
 * 1. Every minute: transitions SCHEDULED auctions to RUNNING when their startAt has passed.
 * 2. Every minute: transitions RUNNING auctions to CLOSED when their endAt has passed.
 *    (Winner resolution is handled by AuctionResolutionFacade in the close flow.)
 */

/**
 * Starts SCHEDULED auctions whose startAt <= now.
 */
export function startScheduledToRunningJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const [count] = await Auction.update(
        { state: 'RUNNING' },
        {
          where: {
            state: 'SCHEDULED',
            startAt: { [Op.lte]: now },
          },
        }
      );
      if (count > 0) {
        console.log(`[Scheduler] ${count} auction(s) transitioned SCHEDULED → RUNNING`);
      }
    } catch (err) {
      console.error('[Scheduler] Error transitioning SCHEDULED → RUNNING:', err);
    }
  });
}

/**
 * Closes RUNNING auctions whose endAt <= now.
 * Triggers the full close + winner resolution + wallet deduction flow.
 */
export function startRunningToClosedJob(): void {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expiredAuctions = await Auction.findAll({
        where: {
          state: 'RUNNING',
          endAt: { [Op.lte]: now },
        },
      });

      for (const auction of expiredAuctions) {
        try {
          // Import Facade lazily to avoid circular dependency issues
          const { AuctionResolutionFacade } = await import('../facades/AuctionResolutionFacade');
          await AuctionResolutionFacade.closeAndResolve(auction);
          console.log(`[Scheduler] Auction ${auction.uuid} RUNNING → CLOSED (resolved)`);
        } catch (err) {
          console.error(`[Scheduler] Error closing auction ${auction.uuid}:`, err);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error transitioning RUNNING → CLOSED:', err);
    }
  });
}

/**
 * Initializes all auction background schedulers.
 */
export function initAuctionSchedulers(): void {
  startScheduledToRunningJob();
  startRunningToClosedJob();
  console.log('✅ Auction schedulers initialized (SCHEDULED→RUNNING, RUNNING→CLOSED)');
}
