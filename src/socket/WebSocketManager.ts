import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth';

export type WsEventType =
  | 'AUCTION_START'
  | 'PRICE_UPDATE'
  | 'AUCTION_CLOSE'
  | 'AWARD_COMPLETED'
  | 'NEW_BID'
  | 'ERROR';

export interface WsMessage {
  event: WsEventType;
  auctionUuid: string;
  payload: unknown;
}

/**
 * Observer Pattern — WebSocketManager Singleton.
 * Maintains a registry of connected clients and broadcasts events
 * to all authenticated subscribers.
 */
export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, JwtPayload> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Attaches the WebSocket server to the given HTTP server.
   * Authenticates connections via ?token= query parameter (RS256 JWT).
   */
  public attach(server: import('http').Server): void {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request: IncomingMessage, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      try {
        const publicKey = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;

        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.clients.set(ws, decoded);

          ws.on('close', () => {
            this.clients.delete(ws);
          });

          ws.send(JSON.stringify({ event: 'CONNECTED', message: 'WebSocket connected' }));
        });
      } catch {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });

    console.log('✅ WebSocket server attached');
  }

  /**
   * Broadcasts an event to all connected authenticated clients.
   */
  public broadcast(message: WsMessage): void {
    if (!this.wss) return;

    const data = JSON.stringify(message);
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Broadcasts an event to clients subscribed to a specific auction.
   * (All connected clients receive auction events — filtering can be done client-side.)
   */
  public broadcastToAuction(auctionUuid: string, event: WsEventType, payload: unknown): void {
    this.broadcast({ event, auctionUuid, payload });
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = WebSocketManager.getInstance();
