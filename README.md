# 📊 Design Patterns & UML Diagrams

This section outlines the architectural patterns used in the Catalog of Goods and Auction Management System backend.

## 1. State Pattern (Auction States)

Controls auction transitions across `DRAFT`, `SCHEDULED`, `RUNNING`, `CLOSED`, and `CANCELLED`. Bidding is strictly only allowed in the `RUNNING` state.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Auction
    DRAFT --> SCHEDULED : Schedule
    DRAFT --> CANCELLED : Cancel
    SCHEDULED --> RUNNING : Start (Scheduler/Manual)
    SCHEDULED --> CANCELLED : Cancel
    RUNNING --> CLOSED : Close (Scheduler/Manual)
    RUNNING --> CANCELLED : Cancel
    CLOSED --> [*]
    CANCELLED --> [*]
```

## 2. Strategy Pattern (Auction Winner & Bid Validation)

Separates winner resolution and bid validation rules for different auction types (`ENGLISH` vs `SEALED_BID`).

```mermaid
classDiagram
    class AuctionResolutionStrategy {
        <<interface>>
        +resolveWinner(auction: Auction) Bid
        +validateBid(auction: Auction, amount: number, bidderId: bigint) string
    }
    class EnglishAuctionStrategy {
        +resolveWinner(auction: Auction) Bid
        +validateBid(auction: Auction, amount: number, bidderId: bigint) string
    }
    class SealedBidAuctionStrategy {
        +resolveWinner(auction: Auction) Bid
        +validateBid(auction: Auction, amount: number, bidderId: bigint) string
    }
    class AuctionStrategyFactory {
        +getStrategy(type: AuctionType) AuctionResolutionStrategy
    }

    AuctionResolutionStrategy <|.. EnglishAuctionStrategy
    AuctionResolutionStrategy <|.. SealedBidAuctionStrategy
    AuctionStrategyFactory ..> AuctionResolutionStrategy : Resolves
```

## 3. Observer Pattern (WebSocket Manager)

Broadcasts real-time events (`PRICE_UPDATE`, `NEW_BID`, `AUCTION_START`, `AUCTION_CLOSE`, `AWARD_COMPLETED`) to connected subscribers.

```mermaid
classDiagram
    class WebSocketManager {
        -wss: WebSocketServer
        -clients: Map~WebSocket, JwtPayload~
        +attach(server: Server) void
        +broadcast(message: WsMessage) void
        +broadcastToAuction(auctionUuid: string, event: WsEventType, payload: any) void
    }
```
