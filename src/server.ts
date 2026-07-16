import http from 'http';
import app from './app';
import { sequelize } from './config/database';
import { wsManager } from './socket/WebSocketManager';
import { initAuctionSchedulers } from './jobs/auctionScheduler';
// Models must be imported to register associations
import './models/index';

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer(app);

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Attach WebSocket server (Observer Pattern)
    wsManager.attach(server);

    // Start background auction state schedulers
    initAuctionSchedulers();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

export { server };
