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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/goods', goodRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

export default app;
