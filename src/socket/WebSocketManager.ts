import { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../middleware/auth';

export type WsEventType =
  | 'AUCTION_START'
  | 'NEW_BID'
  | 'PRICE_UPDATE'
  | 'AUCTION_CLOSE'
  | 'AWARD_COMPLETED';

export interface WSEvent {
  event: WsEventType;
  auctionId: string; // matches PDF (using public uuid)
  payload: any;
}

/**
 * Observer Pattern — WebSocketManager.
 * Centralized singleton managing client connections and real-time broadcasts.
 */
export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss?: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map(); // Map connection IDs/userIds to sockets

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Initializes the WebSocket server instance.
   */
  public initialize(server: any): void {
    this.wss = new WebSocketServer({ noServer: true });
    
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage, user: any) => {
      const connectionId = `${user.id}-${Date.now()}`;
      this.clients.set(connectionId, ws);
      
      console.log(`User ${user.id} connected via WebSocket.`);
      
      ws.on('close', () => {
        this.clients.delete(connectionId);
        console.log(`User ${user.id} disconnected.`);
      });
      
      ws.on('error', (err) => {
        console.error(`WebSocket error for user ${user.id}:`, err);
      });
    });
  }

  /**
   * Handles HTTP Upgrade handshake and authenticates using query parameter token.
   */
  public handleUpgrade(request: IncomingMessage, socket: any, head: Buffer): void {
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

      this.wss?.handleUpgrade(request, socket, head, (ws) => {
        this.wss?.emit('connection', ws, request, decoded);
      });
    } catch (err) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
    }
  }

  /**
   * Broadcasts an event to all connected clients.
   */
  public broadcast(message: WSEvent): void {
    const payloadString = JSON.stringify(message);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payloadString);
      }
    });
  }

  /**
   * Helper method to broadcast to a specific auction.
   */
  public broadcastToAuction(auctionUuid: string, event: WsEventType, payload: any): void {
    this.broadcast({
      event,
      auctionId: auctionUuid,
      payload,
    });
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}

export const wsManager = WebSocketManager.getInstance();
export default WebSocketManager;
