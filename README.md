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

#### **Visualizing MVC and Design Patterns in File Structure**

The following image maps these folders and classes visually to highlight the design integrity of the backend:

<div align="center">
  <img src="./assets/file%20structure.png" width="650" alt="Project File Structure">
</div>

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

#### **3.4.2 Database Keys: Auto-Incrementing IDs vs. UUIDs**

##### **Technical Comparison**
| Aspect | Auto-Incrementing Integer (`id`) | UUID (`uuid`) |
| :--- | :--- | :--- |
| **Storage Size** | 4 bytes (`INT`) or 8 bytes (`BIGINT`) | 16 bytes (128-bit) |
| **Index Performance** | Fast read/write (small index size, sequential order) | Slower (large index footprint, random insert fragmentation) |
| **Clustered Index Friendly** | High (order aligns naturally, preventing page splits) | Low (random generation causes frequent page splits) |
| **Security & Obscurity** | Poor (vulnerable to user enumeration attacks) | High (unguessable random entropy) |
| **Distributed Scaling** | Difficult (requires centralized sync nodes) | Excellent (can be generated client-side offline) |
| **Business Privacy** | Poor (reveals exact registration count to competitors) | High (reveals zero info about scale) |

##### **The Hybrid Key Strategy**
To combine high database performance with strong API security, our project implements a **Hybrid Key Strategy**:
1. **Internal Keys (`id`)**: Every table uses a sequential numeric Primary Key named `id` (`BIGINT`) internally. All Sequelize associations, foreign key joins, and index queries operate on these integer columns to keep indexes small and searches fast.
2. **External Public Keys (`uuid`)**: Public tables exposed to API endpoints (like `Users`, `Auctions`, `Receipts`) feature a secondary index column `uuid` containing a unique `UUIDv4` token. 
3. **Execution Workflow**:
   * The client initiates a request referencing a resource's UUID: `GET /api/v1/auctions/395a15fd-c735-80fc-b03d-cc799e3c1085`.
   * The controller queries the database using the UUID: `Auction.findOne({ where: { uuid: req.params.uuid } })`.
   * Once found, it retrieves the record's internal integer `id` (e.g. `42`) to perform all downstream joins and relational operations, maintaining optimum database speed.

---

#### **3.4.3 API Authentication Mechanics**

##### **Security Risks of Path-Based Authentication**
Putting user IDs or tokens directly in URLs (e.g., `/api/v1/goods/:userId` or `/api/v1/goods/:jwt`) creates severe security issues:
* **Server Log Leaks**: HTTP servers (like Nginx, Apache) write complete URL paths in clear text.
* **Browser Cache**: URL routes are saved in history, bookmarks, and caching proxies.
* **Referrer Leaks**: Clicking external links forwards the full URL (containing the token) in the `Referer` header.

##### **The Bearer Token Pattern**
To securely identify users, we use the standard **Bearer Token** pattern in the HTTP `Authorization` header:

```http
POST /api/v1/goods HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInJvbGUiOiJiaWQtY3JlYXRvciJ9...
```

##### **Backend Authentication Flow**

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Request
    participant Auth as Auth Middleware
    participant Ctrl as Router Controller
    participant DB as Postgres Database

    Client->>Auth: Request (Authorization: Bearer <JWT>)
    activate Auth
    Note over Auth: 1. Extract Bearer Token<br/>2. Verify RS256 signature<br/>3. Decode: { id: 12, role: "bid-creator" }
    Auth->>Auth: Inject decoded info: req.user = payload
    Auth->>Ctrl: Call next() to delegate control
    deactivate Auth
    activate Ctrl
    Note over Ctrl: Verify role == 'bid-creator'<br/>Extract creatorId = req.user.id
    Ctrl->>DB: Good.create()
    activate DB
    DB-->>Ctrl: Return created Good
    deactivate DB
    Ctrl-->>Client: 201 Created (Success JSON Response)
    deactivate Ctrl
```

##### **Express Middleware Code Example**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_PUBLIC_KEY as string, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Access forbidden: invalid or expired token.' });
      }
      req.user = decoded as { id: number; role: string };
      next();
    });
  } else {
    return res.status(401).json({ error: 'Access unauthorized: missing Bearer token.' });
  }
}
```

##### **How to Test in Postman**
1. **Login**: Send credentials to `POST /api/v1/auth/login` and copy the JWT string from the response.
2. **Setup Request**: Open the endpoint tab (e.g. `POST /api/v1/goods`).
3. **Configure Headers**:
   * Navigate to the **Authorization** tab directly below the URL bar.
   * Under **Type**, choose **Bearer Token**.
   * Paste the copied JWT into the **Token** input box on the right.
4. **Send Body**: Select **Body ➔ raw ➔ JSON** and click **Send**. Postman will automatically inject the `Authorization: Bearer <JWT>` header.

---

#### **3.4.4 Middlewares & Request Verification**

##### **1. Request Schema Validation Middleware**
To prevent SQL injection, malformed records, and invalid types, every mutating request (`POST`, `PUT`, `PATCH`) is verified using schema validation middleware (Zod or Joi) before the query ever hits the database:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed.',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }
      next(error);
    }
  };
```

##### **2. Wallet Token Depletion & Expiry Controls**
The bidding route guards against depleted wallet assets:
* **Token Expired / Missing JWT**: Handled by the JWT auth guard, immediately returning `401 Unauthorized`.
* **Depleted / Insufficient Tokens**: If a participant places a bid but their wallet contains `0` or fewer tokens than the bid amount, the controller blocks the query and returns `401 Unauthorized`:
  ```typescript
  const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
  if (!wallet || Number(wallet.balance) <= 0) {
    return res.status(401).json({ error: "Unauthorized: Wallet tokens are fully depleted." });
  }
  if (Number(wallet.balance) < bidAmount) {
    return res.status(401).json({ error: "Unauthorized: Insufficient tokens to cover the bid amount." });
  }
  ```

##### **3. Centralized Error-Handling Middleware**
To avoid repetitive `try/catch` handlers in controller logic, all errors are routed through `next(error)` to a centralized Express error middleware, preventing stack trace leaks:

```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  console.error(`[Error Handler] ${statusCode} - ${message}`, err.stack);
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
```

##### **4. Database Seeding Strategy**
Sequelize database seeding sets up a predictable test dataset:
* **Administrative Profile**: An admin user preloaded with access to wallet recharge routes.
* **Creators (`bid-creators`)**: Preloaded with physical goods (watch, coins, paintings) in the catalog.
* **Participants (`bid-participants`)**: Users pre-allocated with wallets containing an initial balance (e.g. `10,000.00` tokens).
* **Auctions & Bids**: Active, scheduled, and closed historical auctions with pre-loaded bid increment histories and generated receipts.



---

## 📊 4. UML Diagrams

### 4.1 Use Case Diagram
This diagram groups capabilities by actor, eliminating crossing lines so you can understand who does what in less than two seconds:

<div align="center">
  <img src="./assets/use_case_diagram.png" width="650" alt="Use Case Diagram">
</div>

---

### 4.2 Sequence Diagram: Placing a Bid
This simplified sequence diagram tracks how a bid is placed, validated, and saved through four core execution layers:

<div align="center">
  <img src="./assets/bid_sequence_diagram.png" width="650" alt="Sequence Diagram: Placing a Bid">
</div>

---

### 4.3 Sequence Diagram: Auction Closure & Facade Award
This sequence diagram shows the step-by-step transaction flow of resolving a winner, charging a wallet, and creating a receipt:

<div align="center">
  <img src="./assets/closure_sequence_diagram.png" width="650" alt="Sequence Diagram: Auction Closure">
</div>

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
