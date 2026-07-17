# 🏛️ Catalog of Goods and Auction Management System Backend

[![Project Status](https://img.shields.io/badge/status-production--ready-success.svg)](#)
[![TypeScript Version](https://img.shields.io/badge/typescript-v6.0.3-blue.svg)](#)
[![Sequelize Version](https://img.shields.io/badge/sequelize-v6.37.8-red.svg)](#)
[![Jest Test Suite](https://img.shields.io/badge/jest-13%2F13%20passed-brightgreen.svg)](#)

An enterprise-grade, MVC-compliant Node.js backend application designed in **TypeScript** to orchestrate catalog management, wallet validation, real-time bid updates, and multi-strategy auction lifecycles.

---

## 📖 1. Project Description

<div align="center">
  <img src="./assets/historical_traders.jpg" width="500" alt="Historical Traders of Goods">
</div>

The **Catalog of Goods and Auction Management System** manages the lifecycle of physical goods (lots) and their sale through dynamic online bidding channels. The system allows:

1. **Creation of goods** by authorized users.
2. **Scheduling of auctions** associated with those goods.
3. **Starting of auctions**.
4. **User participation (bidding)**.
5. **Closing of auctions** with potential awarding/determination of the winner.

There are two types of bids:
- **Open English Auction ("English Auction"):** An ascending-price auction. Users can make visible bids/increases until the auction closes. The participant with the highest bid wins, provided that all auction constraints and wallet credit availability are met.
- **First-Price Sealed-Bid Auction ("First Price Sealed Bid Auction"):** Bidders submit their bids by a set deadline without knowing the bids of others. To enforce secrecy, the system dynamically masks/hides the bid amounts and bidder details on the list endpoint (`GET /api/v1/auctions/:uuid/bids`) while the auction is active. When the auction closes, the user with the highest bid wins and pays a price equal to their bid amount.

The platform caters to three primary roles:
- **`bid-creator`**: Curates catalog goods and schedules/starts/concludes auctions.
- **`bid-participant`**: Exchanges tokens, checks balances, places ascending/sealed bids, and reviews spending histories.
- **`admin`**: Controls credit replenishment, extracts PDF billing records, and reviews system-wide metrics.

### 📦 What is a Good/Lot?
A **Good** (or Lot) represents a physical or digital asset stored in the system's catalog that is intended to be put up for sale. 

* **Who can create/upload a Good?**
  Only authenticated users holding the **`bid-creator`** role are permitted to create and upload new goods into the catalog (via `POST /api/v1/goods`).
* **Catalog Properties (Columns):**
  Every Good consists of the following attributes:
  | Column Name | Data Type | Purpose |
  | :--- | :--- | :--- |
  | `name` | String (Max 200) | The display name of the item. |
  | `description` | Text | A detailed description of the item. |
  | `category` | String (Max 100) | The group classification (e.g., "Antiques"). |
  | `basePrice` | Decimal (15, 2) | The catalog's starting price for the item. |
  | `isAvailable` | Boolean | Availability status; shows if the good can be currently scheduled (defaults to `true`). |

---

### 🔄 Auction States & Transitions

#### **What is an Auction?**
Each **auction** must have a state

#### **Types of Auction States**
To manage the lifecycle of an auction, the system tracks its current status using one of the following states:
| State | Behavior & Bidding Constraint | Valid Next Transitions |
| :--- | :--- | :--- |
| **`DRAFT`** | Bidding is **blocked**. The auction details (pricing, times) can still be modified. | `SCHEDULED`, `CANCELLED` |
| **`SCHEDULED`** | Bidding is **blocked**. The auction configuration is locked and is waiting to reach its start time. | `RUNNING`, `CANCELLED` |
| **`RUNNING`** | Bidding is **open**. Bids are validated against rules, wallets are verified, and bids are recorded. | `CLOSED`, `CANCELLED` |
| **`CLOSED`** | Bidding is **blocked**. The winner is resolved, wallets are settled, and a PDF receipt is produced. | *None* (Terminal State) |
| **`CANCELLED`** | Bidding is **blocked**. The auction is terminated prematurely. | *None* (Terminal State) |

#### **What is a State Transition?**
A **State Transition** represents the movement of an auction from one state to another (e.g., from `SCHEDULED` to `RUNNING`). Transitions are triggered either manually by administrators/creators via specific HTTP API routes or automatically by a background cron scheduler. 

Our application uses the **State Design Pattern** to enforce these rules dynamically. Bids are blocked in all states except `RUNNING`, and terminal states cannot be changed back.

#### **State Transition Rules Diagram**
The following state diagram shows the permitted paths and actions for state transitions:
```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Auction
    DRAFT --> SCHEDULED : Action: schedule()
    DRAFT --> CANCELLED : Action: cancel()
    SCHEDULED --> RUNNING : Action: start()
    SCHEDULED --> CANCELLED : Action: cancel()
    RUNNING --> CLOSED : Action: close()
    RUNNING --> CANCELLED : Action: cancel()
    CLOSED --> [*]
    CANCELLED --> [*]
```

#### **Authorized Users for State Transitions**
The diagram below details which roles are authorized to trigger each state transition:
<div align="center">
  <img src="./assets/state_transition_authorized_users.png" width="500" alt="State Transition Authorized Users">
</div>

---

### 📊 Comparative Bidding Process: English vs. Sealed-Bid
The following diagram contrasts the public, real-time feedback loop of an **Open English Auction** against the private, single-submission lifecycle of a **First-Price Sealed-Bid Auction**:

<div style="max-width: 350px; margin: 0 auto;">

```mermaid
graph TD
    classDef english fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef sealed fill:#efebe9,stroke:#4e342e,stroke-width:2px;
    classDef common fill:#f1f8e9,stroke:#558b2f,stroke-width:2px;

    Start[Auction Initiated] --> Type{Auction Type}
    
    %% English Auction Flow
    Type -->|English Auction| EngStart[Auction status: RUNNING]
    EngStart --> EngView[Bids are PUBLIC]
    EngView --> EngBid[Bidders place ascending bids<br/>Must exceed current + increment]
    EngBid --> EngCheck{Time expired?}
    EngCheck -->|No| EngView
    EngCheck -->|Yes| EngEnd[Resolve: Highest bid wins<br/>Winner pays highest bid amount]

    %% Sealed Bid Flow
    Type -->|Sealed-Bid Auction| SealStart[Auction status: RUNNING]
    SealStart --> SealView[Bids are HIDDEN / BLIND]
    SealView --> SealBid[Bidders submit single bids<br/>Deadline-driven]
    SealBid --> SealCheck{Deadline reached?}
    SealCheck -->|No| SealView
    SealCheck -->|Yes| SealEnd[Resolve: Reveal all bids<br/>Highest bid wins & pays their bid]

    EngEnd --> End[Receipt & Wallet settlement]
    SealEnd --> End

    class EngStart,EngView,EngBid,EngCheck,EngEnd english;
    class SealStart,SealView,SealBid,SealCheck,SealEnd sealed;
    class Start,Type,End common;
```

</div>

---

### 🌟 Real Usecase Scenarios

> [!NOTE]  
> **Scenario A: Selling Expensive Art (English Auction)**
> - A Seller (`bid-creator`) posts a *Vintage Rolex* to the catalog.
> - An auction is scheduled with a starting price of **1,000 tokens** and a minimum increment of **100 tokens**.
> - Multiple bidders (`bid-participants`) submit bids in real-time. Bids are publicly visible, and the price ticks up (1,100 -> 1,200).
> - Upon closing, the system locks the winner's wallet, deducts 1,200 tokens, generates a PDF receipt, and broadcasts a WebSocket notification (`AWARD_COMPLETED`).

> [!NOTE]  
> **Scenario B: Government Procurement (Sealed-Bid Auction)**
> - A *Land for rent* is scheduled as a sealed-bid auction.
> - Bidders submit blind bids of **5,000 tokens**, **6,500 tokens**, etc.
> - Nobody can view other participants' bids during the live run.
> - At the deadline, the auction closes. The strategy resolves the **6,500 token** bid as the winner. The winner pays exactly their own winning bid amount.

## 🎯 2. Project Objective

Imagine you are visiting a new online marketplace for the first time. You want to understand how it works. Our system has four main goals to make sure the auctions are fair, safe, and easy to use. Here is the story of how our system works:

### 🔄 2.1 Lifecycle Consistency: "Following the Steps of the Game"
Imagine you walk into a real auction room. You see a beautiful painting. But the auction has not started yet. Can you bid on it? No, you cannot. What if the auction ended ten minutes ago, or was cancelled? You cannot bid then either.

Our system behaves like a strict referee. It makes sure that every auction goes through correct steps in a specific order: `DRAFT` (not yet scheduled) ➔ `SCHEDULED` (waiting for start time) ➔ `RUNNING` (active bidding) ➔ `CLOSED` or `CANCELLED`.
* **You can only bid when the auction is `RUNNING`**: If you try to bid when the auction is still `SCHEDULED` or already `CLOSED`, the system stops you and shows an error message.
* **We do not sell the same item twice**: When an auction starts, the system locks the item (`isAvailable = false`). Nobody else can start another auction for this item. The item is unlocked (`isAvailable = true`) only when the auction finishes or gets cancelled.

### 🛡️ 2.2 Security & Data Privacy: "Only Allowed Users Can Enter"
An auction system handles a lot of money and private data. We must protect it. For example, a normal buyer should not be able to create new items or see other users' passwords.

Our system keeps things safe using roles (permissions) and security checks:
* **The Gatekeeper**: The system checks who you are using a secure key called **JSON Web Token (JWT)**.
* **Different Roles**: A normal buyer (`bid-participant`) can only bid and check their wallet. They cannot create items (only the `bid-creator` can do this). They also cannot add money to other users' wallets (only the `admin` can do this).
* **Sealed Bid Secrecy**: In a Sealed-Bid auction, you cannot see what other people bid. If you ask the API for the list of bids, it hides the amounts and the usernames of the bidders while the auction is running. The system only shows this information after the auction is `CLOSED`.

### 🧩 2.3 Behavioral Extensibility: "Adding New Bidding Styles Easily"
What if we want to add a new type of auction tomorrow? For example, a "Dutch Auction" (where the price goes down instead of up). In a bad system, we would have to change all our code, and we might break existing features.

Our system is built using a clean design pattern called the **Strategy Pattern**:
* We separated the bidding rules from the rest of the application.
* The system treats the bidding styles like separate plug-in modules.
* The controller uses the correct strategy depending on the auction type (English or Sealed-Bid). If we want to add a new type of auction in the future, we just write a new module. We do not need to change the main code of the system.

### 📝 2.4 Auditability: "Keeping Clear Records"
Trust is very important when money is involved. We must prevent arguments about who won and how much they paid.

Our system makes sure all transaction records are permanent and clear:
* **All-or-Nothing Transactions**: When an auction ends, the system takes tokens from the winner's wallet and creates a receipt at the same time. If the server loses power in the middle of this action, the database cancels the changes. Either both actions succeed, or nothing happens. This is called a database transaction.
* **Permanent PDF Receipts**: When an auction closes, the system automatically creates a **PDF Receipt**. This receipt is a permanent proof of the sale. It shows the time, the item, the winner, and the price.

---

## 🏗️ 3. Architecture & Design (For Beginners & Non-Techs)

Understanding a backend application can be tricky if you are not a developer. To make it simple, let's imagine this system is like a **physical, high-security Auction House**.

---

### 3.1 The Auction House Analogy

Here is how the components of our software correspond to the roles in a real-world auction house:

| Software Concept | Auction House Analogy | What it Does in Simple Terms |
| :--- | :--- | :--- |
| **Middlewares (Security & Rules)** | **Security Guard at the Entrance** | Checks your badge (ID), verifies if you are allowed in (Roles), and checks if your documents are filled out correctly (Data Validation). |
| **Controllers (Managers)** | **Front Desk Coordinator** | Greets you, receives your request (e.g., "I want to bid"), and points you to the correct room. |
| **State & Strategy (Logic)** | **The Auctioneer & Rule Book** | Decides if bids are allowed right now (State) and calculates who wins based on the auction style (Strategy). |
| **Models & DB (Database)** | **The Lockbox & Filing Cabinets** | A secure place where the history of all lots, bids, user balances, and final invoices are permanently written down. |
| **WebSockets (Broadcasts)** | **Megaphone & Electronic Billboard** | Instantly broadcasts any price increases or closure notices to everyone in the building. |

---

### 3.2 Diagram 1: The Overall Request Journey (How a Bid is Processed)

When a user places a bid, it travels through several security checkrooms before being permanently stored:

```mermaid
graph LR
    %% Styling Definitions
    classDef step fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#000;
    classDef role fill:#63b3ed,stroke:#3182ce,stroke-width:2px,color:#000;
    classDef data fill:#9ae6b4,stroke:#38a169,stroke-width:2px,color:#000;

    A[1. Customer Placed Bid]:::role --> B[2. Security Guards check ID & Role]:::step
    B --> C[3. Front Desk routes request]:::step
    C --> D[4. Auctioneer validates rules]:::step
    D --> E[5. Saved to File Cabinet]:::data
    E --> F[6. Megaphone Broadcasts update]:::step
```

---

### 3.3 Diagram 2: The Security Guard Checks (Middlewares)

Before your request can reach the auction logic, it must pass three gates at the front door. If any gate fails, the user is immediately turned away:

```mermaid
graph TD
    %% Styling Definitions
    classDef pass fill:#c6f6d5,stroke:#38a169,stroke-width:2px,color:#000;
    classDef fail fill:#fed7d7,stroke:#e53e3e,stroke-width:2px,color:#000;
    classDef check fill:#e2e8f0,stroke:#4a5568,stroke-width:2px,color:#000;

    Start[Incoming Request] --> C1{Gate 1: Is badge genuine? JWT Check}:::check
    C1 -->|No| F1[401 Unauthorized: Turned Away]:::fail
    C1 -->|Yes| C2{Gate 2: Are you allowed here? Role Check}:::check
    C2 -->|No| F2[403 Forbidden: Blocked]:::fail
    C2 -->|Yes| C3{Gate 3: Is bid form filled correctly? Zod Check}:::check
    C3 -->|No| F3[400 Bad Request: Form Error]:::fail
    C3 -->|Yes| OK[Passed: Sent to Controller]:::pass
```

---

### 3.4 Diagram 3: Bidding Logic Checks (State & Strategy)

Once inside, the **State** checks if the auction is active, and the **Strategy** verifies if your bid is valid according to the auction rules:

```mermaid
graph TD
    %% Styling Definitions
    classDef decision fill:#e2e8f0,stroke:#4a5568,stroke-width:2px,color:#000;
    classDef action fill:#9ae6b4,stroke:#38a169,stroke-width:2px,color:#000;
    classDef reject fill:#fed7d7,stroke:#e53e3e,stroke-width:2px,color:#000;

    Start[Request to Place Bid] --> S1{State Check: Is auction running?}:::decision
    S1 -->|No: Draft, Scheduled, or Closed| R1[Reject: Auction not running]:::reject
    S1 -->|Yes: Running| S2{Type Check: What kind of auction?}:::decision

    S2 -->|English Auction| E1{Is bid >= highest bid + increment?}:::decision
    E1 -->|No| R2[Reject: Bid too low]:::reject
    E1 -->|Yes| ACC[Accept Bid & Broadcast]:::action

    S2 -->|Sealed Bid| SE1{Is bid >= catalog starting price?}:::decision
    SE1 -->|No| R3[Reject: Below base price]:::reject
    SE1 -->|Yes| ACC
```

---

### 3.5 Diagram 4: Database Relationships (The Filing Cabinet)

To ensure nothing is lost, the file cabinets (database tables) are connected together. For instance, a **Receipt** cannot exist unless an **Auction** finishes, and a **Bid** is always linked to a specific **User**:

```mermaid
graph TD
    %% Styling Definitions
    classDef entity fill:#e2e8f0,stroke:#4a5568,stroke-width:2px,color:#000;

    U[User File]:::entity -->|1-to-1| W[Wallet File]:::entity
    U -->|1-to-Many| G[Goods File]:::entity
    U -->|1-to-Many| A[Auction File]:::entity
    U -->|1-to-Many| B[Bids File]:::entity
    U -->|1-to-Many| R[Receipt File]:::entity

    G -->|Listed in| A
    A -->|Receives| B
    A -->|Produces| R
```

---

### 3.6 Justifications for this Setup

1. **Why keep these separate? (Separation of Concerns)**:
   - If the database file cabinet structure changes, the security guards (middlewares) do not need to be retrained. Everything has a singular, dedicated job.
2. **Why use a transaction during resolution?**:
   - If an auction closes, we must simultaneously deduct tokens from the winner's wallet, update the auction to "closed", and print the receipt. If the server loses power halfway through, we rollback all changes to prevent incomplete records (e.g., losing money but getting no receipt).
3. **Why do we need WebSockets?**:
   - Instead of users refreshing their browser pages every second to check if they have been outbid, the megaphone (WebSocket) pushes the updates to their screens instantly.

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
