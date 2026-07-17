# 🏛️ Catalog of Goods and Auction Management System Backend

[![Project Status](https://img.shields.io/badge/status-production--ready-success.svg)](#)
[![TypeScript Version](https://img.shields.io/badge/typescript-v6.0.3-blue.svg)](#)
[![Sequelize Version](https://img.shields.io/badge/sequelize-v6.37.8-red.svg)](#)
[![Jest Test Suite](https://img.shields.io/badge/jest-13%2F13%20passed-brightgreen.svg)](#)

An enterprise-grade, MVC-compliant Node.js backend application designed in **TypeScript** to orchestrate catalog management, wallet validation, real-time bid updates, and multi-strategy auction lifecycles.

---

## 📖 1. Project Description

![Auction Dashboard Mockup](./assets/auction_dashboard_mockup.jpg)

The **Catalog of Goods and Auction Management System** manages the lifecycle of physical goods (lots) and their sale through dynamic online bidding channels. The platform caters to three primary roles:
- **`bid-creator`**: Curates catalog goods and schedules/starts/concludes auctions.
- **`bid-participant`**: Exchanges tokens, checks balances, places ascending/sealed bids, and reviews spending histories.
- **`admin`**: Controls credit replenishment, extracts PDF billing records, and reviews system-wide metrics.

### 🌟 Real Usecase Scenarios

> [!NOTE]  
> **Scenario A: High-Value Art Sale (English Auction)**
> - A curator (`bid-creator`) posts a *Vintage Rolex* to the catalog.
> - An auction is scheduled with a starting price of **1,000 tokens** and a minimum increment of **100 tokens**.
> - Multiple bidders (`bid-participants`) submit bids in real-time. Bids are publicly visible, and the price ticks up (1,100 -> 1,200).
> - Upon closing, the system locks the winner's wallet, deducts 1,200 tokens, generates a PDF receipt, and broadcasts a WebSocket notification (`AWARD_COMPLETED`).

> [!NOTE]  
> **Scenario B: Government Procurement (Sealed-Bid Auction)**
> - A *Land Lease Lot* is scheduled as a sealed-bid auction.
> - Bidders submit blind bids of **5,000 tokens**, **6,500 tokens**, etc.
> - Nobody can view other participants' bids during the live run (`GET /bids` returns hidden amounts).
> - At the deadline, the auction closes. The strategy resolves the **6,500 token** bid as the winner. The winner pays exactly their first-price bid.

---

## 🎯 2. Project Objective

The primary objectives of this system include:
1. **Lifecycle Consistency**: Enforce strict transition rules (e.g., forbidding bids on draft, scheduled, or cancelled auctions).
2. **Security & Data Privacy**: Segregate sensitive credentials from financial profiles and enforce JWT-based role permissions (RBAC).
3. **Behavioral Extensibility**: Support interchangeable bidding algorithms (ascending vs. blind) conforming to the Open/Closed Principle.
4. **Auditability**: Secure all financial actions in atomic database transactions, producing unalterable legal receipts.

---

## 🏗️ 3. Architecture & Design

The application adheres strictly to the **Model-View-Controller (MVC)** architectural pattern, integrated with advanced behavioral patterns:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                    Routing Gateway                     │
                  │   - Express.js HTTP Server   - WS Connection Upgrade   │
                  └─────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                   Controller Layer                     │
                  │   - Auth     - Goods     - Auctions   - Bids/Wallets   │
                  └─────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼
┌───────────────────────────────────────────┴───────────────────────────────────────────┐
│                                       Domain Model                                    │
│   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   │
│   │     User Model        │   │      Wallet Model     │   │      Good Model       │   │
│   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘   │
│   ┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐   │
│   │     Auction Model     │   │       Bid Model       │   │     Receipt Model     │   │
│   └───────────────────────┘   └───────────────────────┘   └───────────────────────┘   │
└───────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │ (Sequelize ORM Mapping)
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 PostgreSQL Persistence                 │
                  └────────────────────────────────────────────────────────┘
```

- **Controller Layer (C)**: Receives verified payloads, delegates logic to state/strategy pattern classes, and handles HTTP responses.
- **View Layer (V)**: Restructures and sanitizes raw model objects before JSON output (e.g., stripping password hashes, hiding sealed bids).
- **Model Layer (M)**: Declares data relationships, constraints, and indexes using Sequelize.

---

## 📊 4. UML Diagrams

### 4.1 Use Case Diagram
Describes the roles and capabilities of all actors:

```mermaid
graph TD
    subgraph Actors
        G[Guest / Public]
        BC[Bid Creator]
        BP[Bid Participant]
        A[Admin]
    end

    subgraph Catalog Use Cases
        UC1[View Goods Catalog]
        UC2[Create Catalog Good]
    end

    subgraph Auction Lifecycle Use Cases
        UC3[Schedule Auction]
        UC4[Start Auction]
        UC5[View Auctions List]
        UC6[Close Auction & Award Winner]
        UC7[View Bid History]
    end

    subgraph Participation & Transactions Use Cases
        UC8[Place Bid]
        UC9[Check Wallet Balance]
        UC10[Recharge Wallet]
        UC11[View Personal History]
        UC12[View Spending Aggregations]
        UC13[Download PDF Awarding Receipt]
        UC14[View Admin Statistics]
    end

    %% Relations
    G --> UC1
    G --> UC5
    G --> UC7

    BC --> UC2
    BC --> UC3
    BC --> UC4
    BC --> UC6

    BP --> UC8
    BP --> UC9
    BP --> UC11
    BP --> UC12
    BP --> UC13

    A --> UC4
    A --> UC6
    A --> UC10
    A --> UC13
    A --> UC14
```

### 4.2 Sequence Diagram: Placing a Bid
Depicts the interactions when a participant submits a new offer on a live auction, emphasizing the role of the State and Strategy patterns:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Bid Participant
    participant Server as Express App
    participant State as AuctionState (Running)
    participant Strategy as EnglishAuctionStrategy
    participant DB as Postgres DB
    participant WS as WebSocketManager

    Client->>Server: POST /api/v1/auctions/:id/bids (w/ JWT + amount)
    Note over Server: authenticateJWT checks RS256 token
    Server->>DB: Fetch Auction, Good, & Wallet
    DB-->>Server: Return DB records
    Server->>State: placeBid(auction, userId, amount)
    Note over State: Verifies wallet credit >= amount
    State->>Strategy: validateBid(auctionId, amount, basePrice)
    Strategy->>DB: Fetch highest active bid
    DB-->>Strategy: Return highest bid
    Note over Strategy: Validates minIncrement rule
    Strategy-->>State: Validation Success
    State->>DB: Create Bid Record
    DB-->>State: Bid created
    State-->>Server: Completed
    Server->>WS: broadcastToAuction(PRICE_UPDATE)
    Server-->>Client: 201 Created (Success JSON)
```

### 4.3 Sequence Diagram: Auction Closure & Facade Award
Details the atomic database transaction wrapping winner resolution, balance deduction, and receipt generation:

```mermaid
sequenceDiagram
    autonumber
    actor Scheduler as node-cron / Admin
    participant Controller as AuctionController
    participant Facade as AuctionResolutionFacade
    participant Strategy as AuctionResolutionStrategy
    participant DB as Postgres DB
    participant WS as WebSocketManager

    Scheduler->>Controller: PATCH /api/v1/auctions/:id/state (action: close)
    Controller->>Facade: closeAndResolve(auction)
    Note over Facade: Start Sequelize Transaction
    Facade->>DB: Update Auction State -> CLOSED
    Facade->>Strategy: resolve(auctionId)
    Strategy->>DB: Find highest bidder
    DB-->>Strategy: Return winning Bid
    Strategy-->>Facade: Return ResolutionResult (WinnerId, amountPaid)
    Facade->>DB: Lock & Fetch Winner Wallet (SELECT FOR UPDATE)
    DB-->>Facade: Return Wallet
    Note over Facade: Deduct winnerWallet.balance
    Facade->>DB: Save Wallet & Create Receipt
    Facade->>DB: Update Auction (winnerId, winningBidId)
    Note over Facade: Commit Sequelize Transaction
    DB-->>Facade: Transaction committed successfully
    Facade->>WS: broadcastToAuction(AWARD_COMPLETED)
    Facade-->>Controller: Return updated auction
    Controller-->>Scheduler: 200 OK (Clean DTO)
```

---

## 🎨 5. Description of Design Patterns

### 1. Strategy Pattern
* **Application**: Used to isolate the bid validation and winner determination logic for `ENGLISH` and `SEALED_BID` auction styles.
* **Justification**: English auctions validate against the current highest bid + minimum increment, while sealed-bid auctions only validate against the starting price. By wrapping these calculations in separate strategies (`EnglishAuctionStrategy` and `SealedBidAuctionStrategy`), we comply with the **Open/Closed Principle (OCP)**; adding a new auction type (e.g., Dutch Auction) requires writing a new strategy class without editing core routes or controllers.

### 2. State Pattern
* **Application**: Models the auction states (`DRAFT`, `SCHEDULED`, `RUNNING`, `CLOSED`, `CANCELLED`).
* **Justification**: Eliminates complex nested conditional blocks (e.g., `if (state === 'RUNNING')`) in route controllers. Operational calls (like `placeBid`) are delegated directly to the active state class. If the auction is `DRAFT`, it triggers the error handler. If it is `RUNNING`, it proceeds with validations.

### 3. Observer Pattern
* **Application**: Orchestrates real-time update triggers through `WebSocketManager`.
* **Justification**: Keeps clients updated on changes without needing constant HTTP polling. The server pushes updates automatically whenever state transitions or new bids occur.

### 4. Facade Pattern
* **Application**: Wrapped in `AuctionResolutionFacade` to encapsulate winner resolution, wallet balances deduction, and receipt mapping inside an ACID-compliant database transaction.
* **Justification**: Guarantees database integrity. If a wallet deduction fails due to insufficient credit at close time, the entire transaction is rolled back, preventing orphaned winners or duplicate receipt awards.

---

## 🗄️ 6. Principal Data Model

The database maps six main tables. Relationships are configured through Sequelize:

```
User (1-to-1) ──> Wallet
  │
  ├─(1-to-Many)──> Good (Catalog item)
  │
  ├─(1-to-Many)──> Auction (Created by user)
  │
  ├─(1-to-Many)──> Bid (Placed by participant)
  │
  └─(1-to-Many)──> Receipt (Won by participant)

Good (1-to-Many) ──> Auction
Auction (1-to-Many) ──> Bid
Auction (1-to-1) ──> Receipt
```

### Table Schema Details

#### 1. Users Table
Stores credentials and role identifiers.
- `id` (BIGINT, Primary Key, auto-increment)
- `uuid` (UUID, Unique, indexed)
- `username` (VARCHAR(255), Unique)
- `email` (VARCHAR(255), Unique)
- `password` (VARCHAR(255), stores bcrypt hashes)
- `role` (ENUM('admin', 'bid-creator', 'bid-participant'))

#### 2. Wallets Table
Maintains participant credit tokens.
- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `userId` (BIGINT, Foreign Key referencing Users.id)
- `balance` (DECIMAL(15,2), Default 0.00, check constraint `balance >= 0.00`)

#### 3. Goods Table
Contains the catalog items.
- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `name` (VARCHAR(200))
- `description` (TEXT)
- `category` (VARCHAR(100))
- `basePrice` (DECIMAL(15,2), check constraint `basePrice > 0.00`)
- `isAvailable` (BOOLEAN, default true)
- `createdBy` (BIGINT, Foreign Key referencing Users.id)

#### 4. Auctions Table
Tracks bidding sessions.
- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `goodId` (BIGINT, Foreign Key referencing Goods.id)
- `createdBy` (BIGINT, Foreign Key referencing Users.id)
- `type` (ENUM('ENGLISH', 'SEALED_BID'))
- `state` (ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'CLOSED', 'CANCELLED'), Default 'DRAFT')
- `startingPrice` (DECIMAL(15,2))
- `minimumIncrement` (DECIMAL(15,2), default 1.00)
- `startAt` (TIMESTAMP WITH TIME ZONE)
- `endAt` (TIMESTAMP WITH TIME ZONE)
- `winnerId` (BIGINT, Nullable, Foreign Key referencing Users.id)
- `winningBidId` (BIGINT, Nullable, Foreign Key referencing Bids.id)

#### 5. Bids Table
Records the offers placed.
- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `auctionId` (BIGINT, Foreign Key referencing Auctions.id)
- `bidderId` (BIGINT, Foreign Key referencing Users.id)
- `amount` (DECIMAL(15,2))

#### 6. Receipts Table
Maintains invoicing details of completed auctions.
- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `auctionId` (BIGINT, Foreign Key referencing Auctions.id)
- `winnerId` (BIGINT, Foreign Key referencing Users.id)
- `bidId` (BIGINT, Foreign Key referencing Bids.id)
- `goodId` (BIGINT, Foreign Key referencing Goods.id)
- `amountPaid` (DECIMAL(15,2))
- `transactionId` (UUID, default v4)
- `awardedAt` (TIMESTAMP WITH TIME ZONE)

---

## 🐳 7. How to Start the Project Using Docker Compose

The complete system (application and external PostgreSQL database) can be spun up using Compose.

### Step 1: Clone and Set Up `.env`
Create a `.env` file in the root directory:
```bash
DB_USER=auction_user
DB_PASSWORD=secure_db_password
DB_NAME=auction_db
DB_HOST=postgres
DB_PORT=5432
PORT=3000
JWT_EXPIRES_IN=2h
```

### Step 2: Generate RSA JWT Keys
Run the key generator script to populate keys inside `/keys`:
```bash
node scripts/generateKeys.js
```
Copy private and public key outputs into `.env`:
```bash
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
```

### Step 3: Run Services
Execute the compose build and up commands:
```bash
docker-compose -f docker/docker-compose.yml up --build
```
This boots Postgres, verifies its health status, and then launches the TypeScript app on port `3000`.

---

## 🧪 8. Unit / Integration Testing using Jest

To run the testing suite:
```bash
npm run test
```
The suite runs unit tests verifying the authentication and role middleware behavior, error serializations, and integration route routing using `supertest`.

### Middleware Tests Example ([auth.test.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/tests/middleware/auth.test.ts))
```typescript
describe('authenticateJWT', () => {
  it('should verify token and set req.user if valid', () => {
    const decodedPayload = { id: 1n, role: 'bid-participant' };
    mockRequest.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

    authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(jwt.verify).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(decodedPayload);
    expect(nextFunction).toHaveBeenCalledWith();
  });
});
```

---

## 📬 9. API Testing Examples using Postman

You can test these routes by setting up your request headers with `Authorization: Bearer <TOKEN>`.

### 1. User Registration
`POST /api/v1/auth/register`
```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "SecurePassword1",
  "role": "bid-participant"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "uuid": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c",
    "username": "jane_doe",
    "email": "jane@example.com",
    "role": "bid-participant"
  }
}
```

### 2. User Login
`POST /api/v1/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword1"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "uuid": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c",
      "username": "jane_doe",
      "email": "jane@example.com",
      "role": "bid-participant"
  }
}
```

### 3. Placing a Bid
`POST /api/v1/auctions/7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c/bids`
```json
{
  "amount": 1500
}
```
**Response (210 Created)**:
```json
{
  "success": true,
  "data": {
    "uuid": "3a9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
    "auctionUuid": "7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
    "amount": 1500,
    "createdAt": "2026-07-17T01:00:00.000Z"
  }
}
```

---

## 📄 10. Example Request to Download PDF Awarding Receipt

To download the PDF billing receipt for a won closed auction:

`GET /api/v1/auctions/:uuid/receipt`

### Headers:
- `Authorization: Bearer <TOKEN>` (must be the winning bidder or an admin)

### Response:
- **Status**: `200 OK`
- **Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename=receipt-7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c.pdf`
- **Body**: Binary PDF document stream containing invoice layout, transaction ID, paid tokens count, and timestamp.

---

## 🔌 11. Example of Using the WebSocket Channel

Clients listen to broadcasts on the WebSocket channel using JSON payloads.

### Connection URL:
```
ws://localhost:3000/api/v1/ws?token=<YOUR_JWT_TOKEN>
```

### Incoming Events

#### 1. PRICE_UPDATE (When a participant bids on an English Auction)
```json
{
  "event": "PRICE_UPDATE",
  "auctionId": "7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
  "payload": {
    "auctionUuid": "7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
    "newHighestBid": 1500,
    "bidUuid": "3a9c6c1f-49b2-4d2c-8153-f725a3d76e4c"
  }
}
```

#### 2. AWARD_COMPLETED (When an auction is closed and resolved)
```json
{
  "event": "AWARD_COMPLETED",
  "auctionId": "7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
  "payload": {
    "auction": {
      "uuid": "7d9c6c1f-49b2-4d2c-8153-f725a3d76e4c",
      "type": "ENGLISH",
      "state": "CLOSED",
      "startingPrice": 1000,
      "minimumIncrement": 100,
      "startAt": "2026-07-17T00:00:00.000Z",
      "endAt": "2026-07-17T01:00:00.000Z",
      "winnerId": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c"
    },
    "winnerUuid": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c",
    "amountPaid": 1500
  }
}
```
