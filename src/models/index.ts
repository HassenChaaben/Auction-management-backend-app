/**
 * Models Index — configures all Sequelize associations (1-to-1, 1-to-Many).
 * Import from this file throughout the application to ensure associations are set.
 */
import User from './User';
import Wallet from './Wallet';
import Good from './Good';
import Auction from './Auction';
import Bid from './Bid';
import Receipt from './Receipt';

// ─── User ↔ Wallet (1-to-1) ──────────────────────────────────────────────────
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// ─── User → Goods (1-to-Many) ────────────────────────────────────────────────
User.hasMany(Good, { foreignKey: 'createdBy', as: 'goods' });
Good.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ─── Good → Auctions (1-to-Many) ─────────────────────────────────────────────
Good.hasMany(Auction, { foreignKey: 'goodId', as: 'auctions' });
Auction.belongsTo(Good, { foreignKey: 'goodId', as: 'good' });

// ─── User → Auctions created (1-to-Many) ─────────────────────────────────────
User.hasMany(Auction, { foreignKey: 'createdBy', as: 'createdAuctions' });
Auction.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// ─── User → Auctions won (1-to-Many) ─────────────────────────────────────────
User.hasMany(Auction, { foreignKey: 'winnerId', as: 'wonAuctions' });
Auction.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

// ─── Auction → Bids (1-to-Many) ──────────────────────────────────────────────
Auction.hasMany(Bid, { foreignKey: 'auctionId', as: 'bids', onDelete: 'CASCADE' });
Bid.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' });

// ─── User → Bids placed (1-to-Many) ──────────────────────────────────────────
User.hasMany(Bid, { foreignKey: 'bidderId', as: 'bids' });
Bid.belongsTo(User, { foreignKey: 'bidderId', as: 'bidder' });

// ─── Auction → Receipt (1-to-1) ──────────────────────────────────────────────
Auction.hasOne(Receipt, { foreignKey: 'auctionId', as: 'receipt' });
Receipt.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' });

// ─── User → Receipts (1-to-Many) ─────────────────────────────────────────────
User.hasMany(Receipt, { foreignKey: 'winnerId', as: 'receipts' });
Receipt.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

// ─── Bid → Receipt (1-to-1) ──────────────────────────────────────────────────
Bid.hasOne(Receipt, { foreignKey: 'bidId', as: 'receipt' });
Receipt.belongsTo(Bid, { foreignKey: 'bidId', as: 'winningBid' });

// ─── Good → Receipts (1-to-Many) ─────────────────────────────────────────────
Good.hasMany(Receipt, { foreignKey: 'goodId', as: 'receipts' });
Receipt.belongsTo(Good, { foreignKey: 'goodId', as: 'good' });

export { User, Wallet, Good, Auction, Bid, Receipt };
