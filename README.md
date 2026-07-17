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

## 🎯 2. Project Objectives

Imagine you are visiting a new online marketplace for the first time. You want to understand how it works. Our system has four main goals to make sure the auctions are fair, safe, and easy to use. Here is the story of how our system works:

### 🔄 2.1 Lifecycle Consistency: "Following the Steps of the Game"
Imagine you walk into a real auction room. You see a beautiful painting. But the auction has not started yet. Can you bid on it? No, you cannot. What if the auction ended ten minutes ago, or was cancelled? You cannot bid then either.

Our system behaves like a strict referee using the **State Pattern**. This pattern is a design rule that changes how the program behaves when the status of the auction changes. Instead of writing long and confusing checks in the controller, we create a separate code file for each state. This makes sure that every auction goes through correct steps in a specific order: `DRAFT` (not yet scheduled) ➔ `SCHEDULED` (waiting for start time) ➔ `RUNNING` (active bidding) ➔ `CLOSED` or `CANCELLED`.
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
* The controller uses the correct strategy depending on the auction type (English or Sealed-Bid). 
* **Adding a new auction type (like a Dutch Auction) is very fast and simple**:
  1. Create a new file (like `DutchAuctionStrategy.ts`) inside the `src/strategies/` folder.
  2. Implement the `AuctionResolutionStrategy` interface by writing its two methods: `validateBid()` (checks if a bid is allowed) and `resolve()` (decides the winner).
  3. Register the new strategy name in the `AuctionStrategyFactory.ts` file. 
  *(We do not need to edit any other existing files, keeping the application safe from bugs).*

### 📝 2.4 Auditability: "Keeping Clear Records"
Trust is very important when money is involved. We must prevent arguments about who won and how much they paid.

Our system makes sure all transaction records are permanent and clear:
* **All-or-Nothing Transactions (Database Transactions)**:
  When an auction closes, two critical changes must happen in the database:
  1. The system **deducts the money** from the winner's wallet.
  2. The system **creates a receipt** to prove the purchase.
  
  What if the server crashes or loses power *after* taking the money, but *before* creating the receipt? The user would lose their money and have no proof! 
  To prevent this, we use **database transactions** (specifically SQL transactions). This is an "All-or-Nothing" guard. If any error or crash happens in the middle of the process, the database automatically does an **undo (rollback)**. It resets everything back to normal as if the action never started. Either both actions succeed completely, or neither does. This makes the system 100% reliable for financial audits.
  
  **How we do this technically in the code:** We wrap all database queries inside a `sequelize.transaction()` function block. We pass this transaction parameter to each query (wallet deduct, receipt creation, auction close). If any query fails, Sequelize automatically undoes all changes.
* **Permanent PDF Receipts**: When an auction closes, the system automatically creates a **PDF Receipt**. This receipt is a permanent proof of the sale. It shows the time, the item, the winner, and the price.

---

## 🏗️ 3. Architecture & Design

### 3.1 Architecture: The Big Picture (Our Modern Restaurant)

Before diving into the architectural pattern, let's consider a simple analogy. We can imagine this backend application as a **Busy Modern Restaurant** that serves hungry customers:

* **Docker (The Standardized Food Truck)**: Docker packs the entire restaurant—including the kitchen equipment (Node.js), the safety rules, and the ingredient pantry—into a single food truck. This means you can drive this truck to any city (any developer's computer) and it will cook the exact same food without any setup problems.
* **Node.js & Express (The Waiters & Order Desks)**: Node.js is like a super-fast waiter, and Express is the system of ordering desks. Together, they quickly receive customer requests (like "I want to place a bid"), send them to the correct part of the kitchen, and bring back the response to the customer immediately.
* **TypeScript (The Kitchen Safety Manual)**: TypeScript is the restaurant's strict health and safety guide. It makes sure that every ingredient (data) is exactly the right type, size, and quality before a cook touches it, preventing dangerous mistakes (runtime errors).
* **PostgreSQL & Sequelize ORM (The Locked Pantry & Smart Assistant)**: PostgreSQL is the heavy-duty, locked pantry where all the important items (users, bids, wallets) are kept safe. Sequelize is our smart kitchen assistant (ORM). Instead of making the chef write long, difficult instructions in a special language (SQL) to find an ingredient, we just tell the assistant what we need in plain terms, and it handles the pantry work safely.


in this restaurant, the **MVC pattern** is the organizational layout that divides the daily work. It separates the tasks between the ingredient pantry (Model), the plate presentation department (View), and the front-of-house manager (Controller) to keep the service running perfectly
#### **The Architectural Pattern (MVC): 
To organize our codebase and separate different responsibilities, the application is built strictly around the **Model-View-Controller (MVC)** pattern:

* **Middlewares** (`/src/middleware/`):
  * **General Definition**: Middlewares are intermediate functions that intercept incoming HTTP requests before they reach the main controller logic.
  * **Role in our MVC Pattern**: They act as security guards and data validators at the entry point of the route handler. They run sequentially to analyze request headers and request body payloads.
  * **Goal in our Project**: To verify that the user is logged in (via JWT authorization check), has the correct permissions (Role-Based Access Control, like checking if they are an `admin` or a `bid-creator`), and has submitted valid data formats (Zod request body schema validation). This prevents bad or insecure requests from ever touching our business logic.

* **Controllers** (`/src/controllers/`):
  * **General Definition**: Controllers contain the main business logic and act as managers that coordinate the flow of data within the application.
  * **Role in our MVC Pattern**: They take the cleaned request inputs from the middlewares, determine what needs to be done, invoke the correct state handlers or bidding strategies (State/Strategy Patterns), and interact with models to fetch or update data.
  * **Goal in our Project**: To coordinate all actions when placing a bid, creating a catalog item, scheduling an auction, or closing a finished auction, ensuring all rules are respected.

* **Models** (`/src/models/`):
  * **General Definition**: Models define the structure of the database tables, relations between tables, and the methods used to fetch or save records.
  * **Role in our MVC Pattern**: They represent the database layer. In our code, we define models using Sequelize ORM classes that map directly to PostgreSQL tables.
  * **Goal in our Project**: To manage persistent records of users, wallets, catalog goods, auctions, bids, and receipts, ensuring the database schema is correctly defined and queries are executed safely.

* **Views** (`/src/views/`):
  * **General Definition**: In traditional web development, a view is the visual interface (HTML/CSS). However, in a **backend-only REST API**, the view's job is to format and filter the raw data into JSON objects before sending them as responses back to the client.
  * **Role in our MVC Pattern**: They package the database model outputs into clean, filtered Data Transfer Objects (DTOs) for the client.
  * **Goal in our Project**: To protect privacy and enforce rules. For example, during active sealed auctions, the View's filter dynamically masks the bid amounts and bidder details by setting them to `null` in the JSON response, ensuring copycat bidding is prevented.

#### **Vertical Request Lifecycle Diagram**
Here is a vertical representation of how a client's request journeys through the 4 core components:

<div style="max-width: 300px; margin: 0 auto;">

```mermaid
graph TD
    classDef default fill:#fafafa,stroke:#e0e0e0,stroke-width:1px,rx:5px,ry:5px;
    classDef active fill:#e8f0fe,stroke:#1a73e8,stroke-width:2px,color:#1a73e8,rx:5px,ry:5px;
    classDef endpoint fill:#f1f3f4,stroke:#5f6368,stroke-width:2px,color:#3c4043,rx:20px,ry:20px;

    Req([Client Request]) --> MW[1. Middleware<br/>Auth & Validate]
    MW -->|Valid| CTL[2. Controller<br/>Coordinate & Logic]
    CTL -->|Query| MDL[3. Model<br/>DB SQL Schema]
    MDL -->|Data| CTL
    CTL -->|Filter| VW[4. View<br/>Format DTO JSON]
    VW --> Res([JSON Response])

    class Req,Res endpoint;
    class MW,CTL,MDL,VW active;
```

</div>

---

### 3.2 Design

Design is about how code classes and functions are structured internally to solve specific software design challenges. In your project, this is represented by **Design Patterns**:

#### **1. Strategy Pattern (Bidding Rules: English vs. Sealed-Bid)**
* **Brief Definition**: Instead of writing a single large function with multiple nested `if/else` or `switch` statements to handle different business rules (what abstract definitions call a "family of algorithms"), this pattern defines a single interface (contract). You then write separate classes implementing this interface for each rule set, allowing you to swap between them at runtime depending on the input.
* **Brief Analogy**: Think of a camera app on your phone. You can switch between "Portrait Mode", "Night Mode", or "Video Mode". The camera is the same, but the way it takes the picture changes based on the mode you choose.
* **How we apply it in our app**: The controller [bidController.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/controllers/bidController.ts) handles bid placement. Instead of containing raw conditional statements for each auction style, it delegates validation and resolution to a strategy resolved via [AuctionStrategyFactory.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/factories/AuctionStrategyFactory.ts). The concrete classes [EnglishAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/strategies/EnglishAuctionStrategy.ts) and [SealedBidAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/strategies/SealedBidAuctionStrategy.ts) implement a shared `AuctionResolutionStrategy` interface. This interface declares the `validateBid()` and `resolve()` methods, making the bidding rules interchangeable.

#### **2. State Pattern (Auction State Transitions: DRAFT, SCHEDULED, RUNNING, etc.)**
* **Brief Definition**: This pattern avoids complex conditional checks by representing each state of an object (e.g., status string in a database) as a separate class implementing a common interface. The main class delegates its method calls (like placing a bid or cancelling) to the active state class instance, which changes dynamically as the status changes.
* **Brief Analogy**: Think of a simple vending machine. If it is in the "No Money" state, pressing the buttons does nothing. If it is in the "Money Inserted" state, pressing the buttons dispenses a drink.
* **How we apply it in our app**: The controller [auctionController.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/controllers/auctionController.ts) performs state transitions (like scheduling or starting an auction). Rather than using standard `switch-case` blocks on the status string, it retrieves the state handler using `getAuctionState(auction)` from [src/states/index.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/index.ts). The concrete state classes—[DraftState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/DraftState.ts), [ScheduledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/ScheduledState.ts), [RunningState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/RunningState.ts), [ClosedState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/ClosedState.ts), and [CancelledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/CancelledState.ts)—implement the `AuctionState` interface to restrict actions (e.g., throwing an error in `ClosedState.placeBid()`).

#### **3. Observer Pattern (Real-time updates via WebSockets)**
* **Brief Definition**: This pattern establishes a push-based notification system between a source class (the Subject) and multiple listening clients (the Observers). When a state change or event occurs in the source class, it loops through all registered observers to call a callback function or push a network packet (like WebSockets) to notify them automatically.
* **Brief Analogy**: Think of subscribing to a YouTube channel. When the creator uploads a new video, YouTube automatically sends a notification to all subscribed followers.
* **How we apply it in our app**: We use WebSockets to push live updates. The setup in [websocket.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/config/websocket.ts) acts as the Subject/Broadcaster. When a bid is successfully placed or the auction closes, the system broadcasts updates (like `BID_PLACED` or `AWARD_COMPLETED` events) to all subscribed socket clients connected to the specific auction room, ensuring all participants see the new price or winner instantly.

#### **4. Facade Pattern (Wrapping winner resolution and database transactions in one simple API)**
* **Brief Definition**: This pattern acts as a high-level wrapper class or function. It packages a complex sequence of multiple low-level method calls, database queries, and helper functions into a single, clean API endpoint or method, hiding the complexity from the caller.
* **Brief Analogy**: Think of ordering a book with a "Buy Now" button. You click one button, but behind the scenes, the system checks stock, charges your bank, alerts the delivery company, and updates the database.
* **How we apply it in our app**: Resolving an auction involves multiple database and file system operations. We encapsulate these operations inside [AuctionResolutionFacade.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/facades/AuctionResolutionFacade.ts). When called by [auctionScheduler.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/jobs/auctionScheduler.ts) or controllers, the Facade handles the complex transaction workflow: executing the strategy `resolve()` method, locking/fetching the winner's wallet (`SELECT FOR UPDATE`), subtracting the tokens, generating the PDF receipt via [pdfReceiptHelper.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/helpers/pdfReceiptHelper.ts), saving all changes inside a Sequelize transaction, and broadcasting the WS event.

---

## 📊 4. UML Diagrams

### 4.1 Use Case Diagram
Describes the roles and capabilities of all actors across different subsystems of the project:

```mermaid
graph LR
    %% Modern Color Definitions
    classDef actor fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#1a237e,rx:10px,ry:10px;
    classDef usecase fill:#f1f8e9,stroke:#558b2f,stroke-width:1.5px,color:#33691e,rx:30px,ry:30px;
    classDef admin fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#e65100,rx:10px,ry:10px;

    subgraph Users [Actors]
        G([Guest / Public])
        BC([Bid Creator])
        BP([Bid Participant])
        AD([Administrator])
    end

    subgraph Catalog [Catalog Management]
        UC1(View Goods Catalog)
        UC2(Create Catalog Good)
    end

    subgraph Lifecycle [Auction Lifecycle]
        UC3(Schedule Auction)
        UC4(Start Auction)
        UC5(View Auctions List)
        UC6(Close & Award Auction)
        UC7(View Bid History)
    end

    subgraph Operations [Bids & Wallet Transactions]
        UC8(Place Bid)
        UC9(Check Wallet Balance)
        UC10(Recharge Wallet)
        UC11(View Personal History)
        UC12(View Spending Aggregations)
        UC13(Download PDF Receipt)
        UC14(View System Statistics)
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

    AD --> UC4
    AD --> UC6
    AD --> UC10
    AD --> UC13
    AD --> UC14

    class G,BC,BP actor;
    class AD admin;
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13,UC14 usecase;
```

---

### 4.2 Sequence Diagram: Placing a Bid
Depicts the interactions when a participant submits a new offer on a live auction, emphasizing the execution flow and the role of the State and Strategy patterns:

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    autonumber
    actor Participant as Bid Participant
    participant Server as Express App
    participant State as AuctionState (Running)
    participant Strategy as EnglishAuctionStrategy
    participant DB as Postgres DB
    participant WS as WebSocketManager

    Participant->>Server: POST /api/v1/auctions/:id/bids (amount)
    activate Server
    Note over Server: authenticateJWT checks RS256 token
    Server->>DB: Fetch Auction, Good, & Wallet
    activate DB
    DB-->>Server: Return DB records
    deactivate DB
    Server->>State: placeBid(auction, userId, amount)
    activate State
    Note over State: Verifies wallet credit >= amount
    State->>Strategy: validateBid(auctionId, amount, basePrice)
    activate Strategy
    Strategy->>DB: Fetch highest active bid
    activate DB
    DB-->>Strategy: Return highest bid
    deactivate DB
    Note over Strategy: Validates minIncrement rule
    Strategy-->>State: Validation Success
    deactivate Strategy
    State->>DB: Create Bid Record
    activate DB
    DB-->>State: Bid created
    deactivate DB
    State-->>Server: Completed
    deactivate State
    Server->>WS: broadcastToAuction(PRICE_UPDATE)
    Server-->>Participant: 201 Created (Success JSON)
    deactivate Server
```

---

### 4.3 Sequence Diagram: Auction Closure & Facade Award
Details the atomic database transaction wrapping winner resolution, balance deduction, and receipt generation:

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    autonumber
    actor Scheduler as node-cron / Admin
    participant Controller as AuctionController
    participant Facade as AuctionResolutionFacade
    participant Strategy as AuctionResolutionStrategy
    participant DB as Postgres DB
    participant WS as WebSocketManager

    Scheduler->>Controller: PATCH /api/v1/auctions/:id/state (close)
    activate Controller
    Controller->>Facade: closeAndResolve(auction)
    activate Facade
    Note over Facade: Start Sequelize Transaction
    Facade->>DB: Update Auction State -> CLOSED
    activate DB
    DB-->>Facade: Updated
    deactivate DB
    Facade->>Strategy: resolve(auctionId)
    activate Strategy
    Strategy->>DB: Find highest bidder
    activate DB
    DB-->>Strategy: Return winning Bid
    deactivate DB
    Strategy-->>Facade: Return ResolutionResult
    deactivate Strategy
    Facade->>DB: Lock & Fetch Winner Wallet (SELECT FOR UPDATE)
    activate DB
    DB-->>Facade: Return Wallet
    deactivate DB
    Note over Facade: Deduct winnerWallet.balance
    Facade->>DB: Save Wallet & Create Receipt
    activate DB
    DB-->>Facade: Created
    deactivate DB
    Facade->>DB: Update Auction (winnerId, winningBidId)
    activate DB
    DB-->>Facade: Updated
    deactivate DB
    Note over Facade: Commit Sequelize Transaction
    Facade->>WS: broadcastToAuction(AWARD_COMPLETED)
    Facade-->>Controller: Return updated auction
    deactivate Facade
    Controller-->>Scheduler: 200 OK (Clean DTO)
    deactivate Controller
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
