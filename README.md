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
An **Auction** is a structured system where a seller puts a catalog item (a Good/Lot) up for sale, and buyers compete to purchase it by making offers (bids). The item is sold to the winner at the end of the bidding period based on the rules of the selected auction style.

In our system, every auction has five key features:
1. **Linked Good/Lot**: An auction cannot exist on its own; it must be connected to a specific item in the catalog (like a vintage watch or artwork).
2. **Starting Price**: The minimum number of tokens a bidder must offer to participate. Bids below this price are rejected.
3. **Bidding Strategy**: The rules used to place bids and find the winner (either an ascending **English Auction** or a blind **Sealed-Bid Auction**).
4. **Time Window**: Every auction has a clear schedule with a starting time (`startAt`) and an ending time (`endAt`).
5. **State Lifecycle**: An auction follows a strict set of stages (`DRAFT` ➔ `SCHEDULED` ➔ `RUNNING` ➔ `CLOSED`/`CANCELLED`) to make sure bidding is fair and secure.

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

### 3.3 File Structure

The project codebase is organized to enforce a clean separation of concerns. The directory layout groups files either under the **MVC (Model-View-Controller)** pattern or under one of the **Design Patterns** classes:

```
src/
├── config/             # Configuration files (database, websockets)
├── controllers/        # [MVC: Controller] Coordinates logic and HTTP actions
├── db/                 # Database migrations and seed files
├── facades/            # [Facade Pattern] Atomic multi-record workflows
├── factories/          # [Strategy Pattern] Factory classes for strategies
├── jobs/               # Scheduled cron jobs (scheduler execution loops)
├── middleware/         # [MVC: Middleware] Authentications and validations
├── models/             # [MVC: Model] Sequelize schemas and database tables
├── routes/             # Express API route endpoints
├── schemas/            # Request body validation schemas (Joi)
├── socket/             # [Observer Pattern] WebSocket event handlers
├── states/             # [State Pattern] State machine transition logic
├── strategies/         # [Strategy Pattern] Bidding rule implementations
├── utils/              # General helper functions (PDF exporter)
└── views/              # [MVC: View] Filters JSON response output
```

---

### 3.4 Detailed API Routes

This section specifies all route endpoints, database primary key strategies, token header mechanics, and error handler middlewares.

#### **3.4.1 API Endpoints Specification**

##### **1. Authentication & Registration**
* **`POST /api/v1/auth/register`**
  * *Purpose*: Register a new user profile.
  * *Payload*:
    ```json
    {
      "username": "john_doe",
      "email": "john@example.com",
      "password": "securepassword123",
      "role": "bid-participant"
    }
    ```
    *(Allowed roles: `bid-creator`, `bid-participant`, `admin`)*
  * *Model Operations*: Inserts a record in the `Users` table and automatically creates an associated `Wallet` record preloaded with default initial tokens.
  * *Authorization*: Public (anyone can register).

* **`POST /api/v1/auth/login`**
  * *Purpose*: Authenticate user credentials and return a secure JWT access token.
  * *Payload*:
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword123"
    }
    ```
  * *Model Operations*: Queries `Users` table to verify credentials.
  * *Response*: Returns a JWT signed with RS256 containing user metadata (`id`, `role`).
  * *Authorization*: Public.

##### **2. Goods Catalog Management**
* **`POST /api/v1/goods`**
  * *Purpose*: Create a new item/lot in the system catalog.
  * *Payload*:
    ```json
    {
      "name": "Vintage Watch",
      "description": "1960s mechanical chronograph.",
      "category": "Antiques",
      "basePrice": 150.00
    }
    ```
  * *Model Operations*: Inserts a record into the `Goods` table.
  * *Authorization*: Authorized: `bid-creator` (must present valid JWT). Blocked: `bid-participant`, `admin`, anonymous.

* **`GET /api/v1/goods`**
  * *Purpose*: Retrieve a list of all catalog goods.
  * *Payload*: None *(supports optional query filtering by `?category=...`)*.
  * *Model Operations*: Queries the `Goods` table.
  * *Authorization*: Public (anyone can read the catalog).

##### **3. Auction Lifecycle Management**
* **`POST /api/v1/auctions`**
  * *Purpose*: Schedule a new auction.
  * *Payload*:
    ```json
    {
      "goodId": 12,
      "type": "english",
      "startTime": "2026-07-10T12:00:00.000Z",
      "endTime": "2026-07-12T12:00:00.000Z",
      "parameters": {
        "reservePrice": 180.00,
        "minimumIncrement": 10.00
      }
    }
    ```
    *(Allowed types: `english`, `sealed-bid`)*
  * *Model Operations*: Verifies that `goodId` exists in the `Goods` table, then inserts an `Auctions` record with default state `DRAFT` or `SCHEDULED`.
  * *Authorization*: Authorized: `bid-creator` (must present valid JWT). Blocked: others.

* **`GET /api/v1/auctions`**
  * *Purpose*: Display all auctions, with optional state-based query filtering (e.g., `?status=RUNNING`).
  * *Model Operations*: Queries `Auctions` joined with the `Goods` model.
  * *Authorization*: Public.

* **`POST /api/v1/auctions/:id/start`**
  * *Purpose*: Manually open a scheduled auction for bids.
  * *Model Operations*: Updates the `state` column in the `Auctions` record to `RUNNING`.
  * *Authorization*: Authorized: Creator of the auction (owner) or `admin`. Blocked: others.

* **`POST /api/v1/auctions/:id/close`**
  * *Purpose*: Conclude the auction, resolve the winner, charge the wallet, and export the PDF receipt.
  * *Model Operations*: Wrapped in a transaction block. Updates `state` of `Auctions` to `CLOSED`. Finds the highest bid in `Bids`. Deducts tokens from winner's `Wallet`. Inserts a new record in `Receipts`.
  * *Authorization*: Authorized: Creator of the auction or `admin`. Blocked: others.

##### **4. Bidding Operations**
* **`POST /api/v1/auctions/:id/bids`**
  * *Purpose*: Place a bid on an active auction.
  * *Payload*:
    ```json
    {
      "bidAmount": 200.00
    }
    ```
  * *Model Operations*: Validates body schema. Verifies auction state is `RUNNING`. Verifies participant's `Wallet` balance is ≥ `bidAmount`. Enforces strategy increment rules. Inserts record into `Bids` table.
  * *Authorization*: Authorized: `bid-participant` (must present valid JWT). Blocked: others.

* **`GET /api/v1/auctions/:id/bids`**
  * *Purpose*: View bidding increments and history.
  * *Model Operations*: Queries `Bids` filtered by `auctionId`.
  * *Authorization*: 
    * **English Auctions**: Public (anyone can see increments).
    * **Sealed-Bid Auctions**: Only `admin` or the auction `bid-creator` before close. Bids remain masked from participants until state is `CLOSED`.

##### **5. Wallet and Balance Management**
* **`GET /api/v1/wallet/balance`**
  * *Purpose*: Check current remaining token balance.
  * *Model Operations*: Queries `Wallet` record linked to user ID.
  * *Authorization*: Authorized: `bid-participant`. Blocked: others.

* **`POST /api/v1/admin/wallet/recharge`**
  * *Purpose*: Credit/replenish user's wallet with tokens.
  * *Payload*:
    ```json
    {
      "userId": 4,
      "amount": 500.00
    }
    ```
  * *Model Operations*: Updates the balance column of target user's wallet in the `Wallets` table.
  * *Authorization*: Authorized: `admin` (must present valid JWT). Blocked: others.

##### **6. User History & PDF Receipts**
* **`GET /api/v1/users/me/auctions`**
  * *Purpose*: Browse user's history of bid participations (supports status queries `?status=won` or `?status=lost`).
  * *Model Operations*: Queries `Bids` joined with `Auctions` and `Receipts` filtered by the caller's user ID.
  * *Authorization*: Authorized: `bid-participant`. Blocked: others.

* **`GET /api/v1/users/me/spending`**
  * *Purpose*: View total tokens spent within a given timeframe (`?startDate=...&endDate=...`).
  * *Model Operations*: Aggregates `amountPaid` from receipts linked to user ID.
  * *Authorization*: Authorized: `bid-participant`. Blocked: others.

* **`GET /api/v1/auctions/:id/receipt`**
  * *Purpose*: Generate and download the PDF receipt of a won auction.
  * *Model Operations*: Queries the `Receipts` table and forwards details to the PDF layout builder.
  * *Authorization*: Authorized: The winner (linked to receipt user ID) or `admin`. Blocked: others.

##### **7. Statistics**
* **`GET /api/v1/admin/statistics`**
  * *Purpose*: Extract system-wide financial analytics metrics.
  * *Model Operations*: Multi-table aggregation across `Auctions` and `Bids`.
  * *Authorization*: Authorized: `admin`. Blocked: others.

---
#### **3.4.2 API Authentication Mechanics**

##### **What is Authentication?**
Authentication is the process of verifying a user's identity. In a REST API, when a user registers or logs in with their credentials (username/email and password), the server verifies who they are. Once verified, the server generates a token (JWT) to identify them on future requests, avoiding the need for the user to resend their password with every single action.

##### **What is a JWT (JSON Web Token)?**
A JSON Web Token (JWT) is a compact, secure string used to transmit user identity information between the client and the server. A JWT has three parts:
1. **Header**: Specifies the token type and signing algorithm (e.g., RS256).
2. **Payload**: Contains the encoded user claims (e.g., `userId` and `role`).
3. **Signature**: Verifies that the token was signed by the server and hasn't been tampered with.
Because the server signs the token with a private key, any change to the token by the client will make the signature invalid.

##### **Security Risks of Path-Based Authentication**
Putting user IDs or tokens directly in URLs (e.g., `/api/v1/goods/:userId` or `/api/v1/goods/:jwt`) creates severe security issues:
* **Server Log Leaks**: HTTP servers (like Nginx, Apache, or load balancers) write complete URL paths in plain-text logs. This would expose active tokens.
* **Browser Cache**: URL routes are saved in browser history, bookmarks, and caching proxies.
* **Referrer Leaks**: Clicking external links forwards the full URL (containing the token) to external sites in the `Referer` header.

##### **The Bearer Token Pattern**
To securely identify users, we use the standard **Bearer Token** pattern in the HTTP `Authorization` header. The token is sent inside the headers rather than the URL:

```http
POST /api/v1/goods HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInJvbGUiOiJiaWQtY3JlYXRvciJ9...
```

##### **Backend Authentication Flow**
When a request is made, the Express backend verifies the user transparently using middleware:

```mermaid
%%{init: {'theme': 'neutral'}}%%
sequenceDiagram
    autonumber
    actor Client as Client Request
    participant Auth as Auth Middleware
    participant Ctrl as Router Controller
    participant DB as Postgres Database

    Client->>Auth: Request (w/ Bearer Token Header)
    activate Auth
    Note over Auth: 1. Extract token from Header<br/>2. Verify signature with Public Key<br/>3. Decode payload (e.g., User ID & Role)
    Auth->>Auth: Attach user to Request (req.user = decoded)
    Auth->>Ctrl: Call next() to pass control
    deactivate Auth
    activate Ctrl
    Note over Ctrl: Verify role permission (e.g., bid-creator)<br/>Extract creatorId = req.user.id
    Ctrl->>DB: Database Write / Query
    activate DB
    DB-->>Ctrl: Return database records
    deactivate DB
    Ctrl-->>Client: 201 Created / 200 OK (JSON Response)
    deactivate Ctrl
```
---

## 📊 4. UML Diagrams

### 4.1 Use Case Diagram

<div align="center">
  <img src="./assets/use_case_diagram.png" width="650" alt="Use Case Diagram">
</div>

---

### 4.2 Sequence Diagram: Create Catalog Item

<div align="center">
  <img src="./assets/goods_creation_sequence.png" width="650" alt="Sequence Diagram: Create Catalog Item">
</div>

---

### 4.3 Sequence Diagram: Schedule Auction

<div align="center">
  <img src="./assets/auction_schedule_sequence.png" width="650" alt="Sequence Diagram: Schedule Auction">
</div>

---

### 4.4 Sequence Diagram: Placing a Bid

<div align="center">
  <img src="./assets/bid_placement_sequence.png" width="650" alt="Sequence Diagram: Placing a Bid">
</div>

---

### 4.5 Sequence Diagram: Auction Closure & Award

<div align="center">
  <img src="./assets/closure_sequence_diagram.png" width="650" alt="Sequence Diagram: Auction Closure">
</div>

---

## 🎨 5. Description of Design Patterns

### 1. Strategy Pattern
#### **1. Definition and Description**
The Strategy Pattern is a design pattern that lets an application select which formula or validation logic to use while the program is running. Instead of putting many different math equations, rules, or validation behaviors inside a single class using long and complicated `if/else` or `switch` statements, you extract each formula into its own separate class. The main system can then swap these classes in and out dynamically as needed.
* **Analogy**: Imagine traveling to an airport. You can choose different transportation strategies: taking a bus, taking a taxi, or riding a bicycle. You change your strategy based on your budget and time, but your final destination (the airport) remains the same.
* **Benefits**: It makes it extremely easy to add or change algorithms without editing the main code. This follows the **Open/Closed Principle (OCP)**, which means that the code is open for extension (you can add new auction behaviors easily) but closed for modification (you do not need to change the existing, tested logic, which prevents introducing new bugs).

#### **2. Why We Used It (Justification)**
Our system supports two different types of auctions:
* **English Auction**: Validates that each new bid is higher than the current highest bid plus a minimum increment.
* **Sealed Bid Auction**: Participants place hidden bids, which are validated only against the starting price.


Instead of using complex `if/else` or `switch` blocks inside our bidding routes, we isolate each validation and win-determination algorithm. 



#### **3. How We Implement This Pattern**
* **Folder Location**: `src/patterns/strategy/`
* **Core Interfaces & Files**:
  * [BiddingStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/BiddingStrategy.ts): Defines the common contract interface `BiddingStrategy` with methods like `validateBid` and `determineWinner`.
  * [EnglishAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/EnglishAuctionStrategy.ts): Implements the ascending English auction validation logic.
  * [SealedBidAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/SealedBidAuctionStrategy.ts): Implements the blind/sealed-bid validation logic.
* **Execution Context**: The bidding route controller dynamically selects the correct strategy using `StrategyFactory.ts` based on the auction type database key.

---

### 2. State Pattern
#### **1. Definition and Description**
The State Pattern is a behavioral design pattern that allows an object to change its behavior when its internal state changes. It looks as if the object changed its class.
* **Analogy**: Consider a vending machine. When it is empty (Out of Stock state), pushing buttons does nothing. When it has items but no coins (No Coin state), pushing buttons tells you to insert money. When you insert money (Has Coin state), pushing buttons dispenses soda. The machine responds differently to the exact same button push based on its current state.
* **Benefits**: It replaces massive conditional logic (nested `if/else` or `switch` blocks) with simple polymorphic calls.

#### **2. Why We Used It (Justification)**
An auction transitions through multiple phases: `DRAFT`, `SCHEDULED`, `RUNNING`, `CLOSED`, and `CANCELLED`.
Operations like placing a bid or updating details are only valid in certain states. For example:
* Placing a bid is only permitted in the `RUNNING` state.
* Editing scheduled times is only permitted in the `DRAFT` or `SCHEDULED` state.
Instead of writing messy condition guards in our controllers, we delegate actions directly to a state instance. The state handles its own transitions and behavior, keeping the controllers clean.

#### **3. How We Implement This Pattern**
* **Folder Location**: `src/patterns/state/`
* **Core Interfaces & Files**:
  * [AuctionState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/AuctionState.ts): Defines the base abstract class or interface `AuctionState` with methods like `placeBid()`, `start()`, and `close()`.
  * Concrete State Classes:
    * [DraftState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/DraftState.ts): Blocks bids, allows edits.
    * [ScheduledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/ScheduledState.ts): Blocks bids, allows starting.
    * [RunningState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/RunningState.ts): Directs bids to the active Strategy validator.
    * [ClosedState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/ClosedState.ts) & [CancelledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/CancelledState.ts): Block all mutations.

---

### 3. Observer Pattern
#### **1. Definition and Description**
The Observer Pattern is a design pattern where an object (the subject) maintains a list of dependents (observers) and notifies them automatically of any state changes, usually by calling one of their methods.
* **Analogy**: Think of a newspaper subscription. Instead of you walking to the newsstand every hour to check if a new paper has been printed (polling), you subscribe to the newspaper publisher. The publisher delivers the paper to your mailbox as soon as it is printed (broadcast).
* **Benefits**: It decouples the state publisher from its consumers, supporting event-driven real-time updates.

#### **2. Why We Used It (Justification)**
During a live auction, participants need to see bids and price changes instantly to make decisions. Without observers, clients would have to make HTTP requests every few seconds (polling), which degrades database performance. Using this pattern, when a new bid is saved, the system automatically triggers broadcasts to all active websocket connection observers.

#### **3. How We Implement This Pattern**
* **Folder Location**: `src/socket/`
* **Core Interfaces & Files**:
  * [WebSocketManager.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/socket/WebSocketManager.ts): Serves as the central publisher/subject. It registers active user connection sockets as observers.
  * When a bid is successfully saved, `wsManager.broadcastToAuction()` is called to notify all connected client observers instantly.

---

### 4. Facade Pattern
#### **1. Definition and Description**
The Facade Pattern is a structural design pattern that provides a simplified, clean interface to a complex set of classes, subsystems, or library operations.
* **Analogy**: Consider placing an order on Amazon. You simply click a single "Buy Now" button (the Facade). Behind the scenes, Amazon's backend must check warehouse inventory, charge your credit card, update the shipping queue, generate a PDF invoice, and email you a receipt. You don't interact with these sub-modules directly; the facade coordinates them for you.
* **Benefits**: Simplifies code complexity for clients and isolates critical step-by-step transaction operations.

#### **2. Why We Used It (Justification)**
When an auction closes, multiple actions must run together:
1. Determine the winner.
2. Deduct tokens from the winner's wallet.
3. Transfer credits to the creator's balance.
4. Set the auction state to `CLOSED`.
5. Generate a formal PDF receipt.
If one step fails (e.g., token transfer fails), the whole sequence must rollback. The Facade orchestrates all these steps inside a single Sequelize database transaction block, preventing data corruption.

#### **3. How We Implement This Pattern**
* **Folder Location**: `src/patterns/facade/`
* **Core Interfaces & Files**:
  * [AuctionResolutionFacade.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/facade/AuctionResolutionFacade.ts): Exposes the simplified `resolveAuction(auctionId)` method. It imports the database connection, the PDF generator service, and the Wallet models, executing the complete closure sequence safely inside an SQL transaction block.

---

### 5. Singleton Pattern
#### **1. Definition and Description**
The Singleton Pattern is a creational design pattern that guarantees a class has only one single instance throughout the application lifecycle, and provides a global access point to it.
* **Analogy**: A town's official land registry office. There should only be one official registry office database to avoid conflicting land ownership records. Any person requesting records or registering land goes to this single office.
* **Benefits**: Restricts constructor access, preventing resource leaks and ensuring a single unified state.

#### **2. Why We Used It (Justification)**
Certain classes consume heavy system resources or manage global connections:
* **Sequelize Connection**: Creating multiple database connection pools would exhaust Postgres port allocation and crash the server.
* **WebSocket Server**: Having multiple websocket managers would split connections, meaning some users wouldn't receive updates.
Implementing the Singleton pattern ensures these wrappers are initialized only once.

#### **3. How We Implement This Pattern**
* **Files and Folders**:
  * Database: [src/config/database.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/config/database.ts) declares a `private constructor()` and static `getInstance()` to manage and export the single shared Sequelize instance.
  * WebSockets: [src/socket/WebSocketManager.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/socket/WebSocketManager.ts) implements `private static instance: WebSocketManager` and exposes `getInstance()`.

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
