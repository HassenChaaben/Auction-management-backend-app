import express, { Application } from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
import authRoutes from './routes/authRoutes';
import goodRoutes from './routes/goodRoutes';
import auctionRoutes from './routes/auctionRoutes';
import bidRoutes from './routes/bidRoutes';
import walletRoutes from './routes/walletRoutes';
import adminRoutes from './routes/adminRoutes';
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/goods', goodRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/auctions/:uuid/bids', bidRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;
