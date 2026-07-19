# 🏛️ Catalog of Goods and Auction Management System Backend

[![Project Status](https://img.shields.io/badge/status-production--ready-success.svg)](#)
[![TypeScript Version](https://img.shields.io/badge/typescript-v6.0.3-blue.svg)](#)
[![Sequelize Version](https://img.shields.io/badge/sequelize-v6.37.8-red.svg)](#)
[![Jest Test Suite](https://img.shields.io/badge/jest-13%2F13%20passed-brightgreen.svg)](#)

An enterprise-grade, MVC-compliant Node.js backend application designed in **TypeScript** to orchestrate catalog management, wallet validation, real-time bid updates, and multi-strategy auction lifecycles.

---

## 📚 Table of Contents

- [📖 1. Project Description](#-1-project-description)
  - [📦 What is a Good/Lot?](#-what-is-a-goodlot)
  - [🔄 Auction States & Transitions](#-auction-states--transitions)
    - [What is an Auction?](#what-is-an-auction)
    - [Types of Auction States](#types-of-auction-states)
    - [What is a State Transition?](#what-is-a-state-transition)
    - [State Transition Rules Diagram](#state-transition-rules-diagram)
    - [Authorized Users for State Transitions](#authorized-users-for-state-transitions)
  - [📊 Comparative Bidding Process: English vs. Sealed-Bid](#-comparative-bidding-process-english-vs-sealed-bid)
  - [🌟 Real Usecase Scenarios](#-real-usecase-scenarios)

- [🎯 2. Project Objectives](#-2-project-objectives)
  - [🔄 2.1 Lifecycle Consistency: "Following the Steps of the Game"](#-21-lifecycle-consistency-following-the-steps-of-the-game)
  - [🛡️ 2.2 Security & Data Privacy: "Only Allowed Users Can Enter"](#️-22-security--data-privacy-only-allowed-users-can-enter)
  - [🧩 2.3 Behavioral Extensibility: "Adding New Bidding Styles Easily"](#-23-behavioral-extensibility-adding-new-bidding-styles-easily)
  - [📝 2.4 Auditability: "Keeping Clear Records"](#-24-auditability-keeping-clear-records)

- [🏗️ 3. Architecture & Design](#️-3-architecture--design)
  - [3.1 Architecture: The Big Picture (Our Modern Restaurant)](#31-architecture-the-big-picture-our-modern-restaurant)
  - [3.2 Design](#32-design)
  - [3.3 File Structure](#33-file-structure)
  - [3.4 Detailed API Routes](#34-detailed-api-routes)
    - [3.4.1 API Endpoints Specification](#341-api-endpoints-specification)
    - [3.4.2 API Authentication Mechanics](#342-api-authentication-mechanics)

- [📊 4. UML Diagrams](#-4-uml-diagrams)
  - [4.1 Use Case Diagram](#41-use-case-diagram)
  - [4.2 Sequence Diagram: Create Catalog Item](#42-sequence-diagram-create-catalog-item)
  - [4.3 Sequence Diagram: Schedule Auction](#43-sequence-diagram-schedule-auction)
  - [4.4 Sequence Diagram: Placing a Bid](#44-sequence-diagram-placing-a-bid)
  - [4.5 Sequence Diagram: Auction Closure & Award](#45-sequence-diagram-auction-closure--award)

- [🎨 5. Description of Design Patterns](#-5-description-of-design-patterns)
  - [1. Strategy Pattern](#1-strategy-pattern)
  - [2. State Pattern](#2-state-pattern)
  - [3. Observer Pattern](#3-observer-pattern)
  - [4. Facade Pattern](#4-facade-pattern)
  - [5. Singleton Pattern](#5-singleton-pattern)

- [🗄️ 6. Principal Data Model](#️-6-principal-data-model)
  - [6.1 Table Schema Details](#61-table-schema-details)
  - [6.2 Model Relationships](#62-model-relationships)
  - [6.3 Database Keys: Auto-Incrementing IDs vs. UUIDs](#63-database-keys-auto-incrementing-ids-vs-uuids)
  - [6.4 Database Indexes: Optimization & Constraints](#64-database-indexes-optimization--constraints)
  - [6.5 Database Reliability & Concurrency Controls](#65-database-reliability--concurrency-controls)

- [🐳 7. Setup Project](#-7-setup-project)
  - [7.1 Run Development Version](#71-run-development-version)
  - [7.2 Run Production Version (via Docker Compose)](#72-run-production-version-via-docker-compose)

- [🧪 8. Unit / Integration Testing using Jest](#-8-unit--integration-testing-using-jest)
  - [8.1 Core Concepts of Testing](#81-core-concepts-of-testing)
  - [8.2 Isolated Mocking Strategy (Why Seeding is Not Needed for Tests)](#82-isolated-mocking-strategy-why-seeding-is-not-needed-for-tests)
  - [8.3 Middlewares Under Test](#83-middlewares-under-test)
  - [8.4 Execution and Test Results](#84-execution-and-test-results)

- [📬 9. API Testing Examples using Postman](#-9-api-testing-examples-using-postman)

- [🔌 10. Example of Using the WebSocket Channel](#-10-example-of-using-the-websocket-channel)

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

- **Who can create/upload a Good?**
  Only authenticated users holding the **`bid-creator`** role are permitted to create and upload new goods into the catalog (via `POST /api/v1/goods`).
- **Catalog Properties (Columns):**
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
>
> - A Seller (`bid-creator`) posts a *Vintage Rolex* to the catalog.
> - An auction is scheduled with a starting price of **1,000 tokens** and a minimum increment of **100 tokens**.
> - Multiple bidders (`bid-participants`) submit bids in real-time. Bids are publicly visible, and the price ticks up (1,100 -> 1,200).
> - Upon closing, the system locks the winner's wallet, deducts 1,200 tokens, generates a PDF receipt, and broadcasts a WebSocket notification (`AWARD_COMPLETED`).

> [!NOTE]  
> **Scenario B: Government Procurement (Sealed-Bid Auction)**
>
> - A *Land for rent* is scheduled as a sealed-bid auction.
> - Bidders submit blind bids of **5,000 tokens**, **6,500 tokens**, etc.
> - Nobody can view other participants' bids during the live run.
> - At the deadline, the auction closes. The strategy resolves the **6,500 token** bid as the winner. The winner pays exactly their own winning bid amount.

## 🎯 2. Project Objectives

Imagine you are visiting a new online marketplace for the first time. You want to understand how it works. Our system has four main goals to make sure the auctions are fair, safe, and easy to use. Here is the story of how our system works:

### 🔄 2.1 Lifecycle Consistency: "Following the Steps of the Game"

Imagine you walk into a real auction room. You see a beautiful painting. But the auction has not started yet. Can you bid on it? No, you cannot. What if the auction ended ten minutes ago, or was cancelled? You cannot bid then either.

Our system behaves like a strict referee using the **State Pattern**. This pattern is a design rule that changes how the program behaves when the status of the auction changes. Instead of writing long and confusing checks in the controller, we create a separate code file for each state. This makes sure that every auction goes through correct steps in a specific order: `DRAFT` (not yet scheduled) ➔ `SCHEDULED` (waiting for start time) ➔ `RUNNING` (active bidding) ➔ `CLOSED` or `CANCELLED`.

- **You can only bid when the auction is `RUNNING`**: If you try to bid when the auction is still `SCHEDULED` or already `CLOSED`, the system stops you and shows an error message.
- **We do not sell the same item twice**: When an auction starts, the system locks the item (`isAvailable = false`). Nobody else can start another auction for this item. The item is unlocked (`isAvailable = true`) only when the auction finishes or gets cancelled.

### 🛡️ 2.2 Security & Data Privacy: "Only Allowed Users Can Enter"

An auction system handles a lot of money and private data. We must protect it. For example, a normal buyer should not be able to create new items or see other users' passwords.

Our system keeps things safe using roles (permissions) and security checks:

- **The Gatekeeper**: The system checks who you are using a secure key called **JSON Web Token (JWT)**.
- **Different Roles**: A normal buyer (`bid-participant`) can only bid and check their wallet. They cannot create items (only the `bid-creator` can do this). They also cannot add money to other users' wallets (only the `admin` can do this).
- **Sealed Bid Secrecy**: In a Sealed-Bid auction, you cannot see what other people bid. If you ask the API for the list of bids, it hides the amounts and the usernames of the bidders while the auction is running. The system only shows this information after the auction is `CLOSED`.

### 🧩 2.3 Behavioral Extensibility: "Adding New Bidding Styles Easily"

What if we want to add a new type of auction tomorrow? For example, a "Dutch Auction" (where the price goes down instead of up). In a bad system, we would have to change all our code, and we might break existing features.

Our system is built using a clean design pattern called the **Strategy Pattern**:

- We separated the bidding rules from the rest of the application.
- The system treats the bidding styles like separate plug-in modules.
- The controller uses the correct strategy depending on the auction type (English or Sealed-Bid).
- **Adding a new auction type (like a Dutch Auction) is very fast and simple**:
  1. Create a new file (like `DutchAuctionStrategy.ts`) inside the `src/strategies/` folder.
  2. Implement the `AuctionResolutionStrategy` interface by writing its two methods: `validateBid()` (checks if a bid is allowed) and `resolve()` (decides the winner).
  3. Register the new strategy name in the `AuctionStrategyFactory.ts` file.
  *(We do not need to edit any other existing files, keeping the application safe from bugs).*

### 📝 2.4 Auditability: "Keeping Clear Records"

Trust is very important when money is involved. We must prevent arguments about who won and how much they paid.

Our system makes sure all transaction records are permanent and clear:

- **All-or-Nothing Transactions (Database Transactions)**:
  When an auction closes, two critical changes must happen in the database:
  1. The system **deducts the money** from the winner's wallet.
  2. The system **creates a receipt** to prove the purchase.
  
  What if the server crashes or loses power *after* taking the money, but *before* creating the receipt? The user would lose their money and have no proof!
  To prevent this, we use **database transactions** (specifically SQL transactions). This is an "All-or-Nothing" guard. If any error or crash happens in the middle of the process, the database automatically does an **undo (rollback)**. It resets everything back to normal as if the action never started. Either both actions succeed completely, or neither does. This makes the system 100% reliable for financial audits.
  
  **How we do this technically in the code:** We wrap all database queries inside a `sequelize.transaction()` function block. We pass this transaction parameter to each query (wallet deduct, receipt creation, auction close). If any query fails, Sequelize automatically undoes all changes.
- **Permanent PDF Receipts**: When an auction closes, the system automatically creates a **PDF Receipt**. This receipt is a permanent proof of the sale. It shows the time, the item, the winner, and the price.

---

## 🏗️ 3. Architecture & Design

### 3.1 Architecture: The Big Picture (Our Modern Restaurant)

Before diving into the architectural pattern, let's consider a simple analogy. We can imagine this backend application as a **Busy Modern Restaurant** that serves hungry customers:

- **Docker (The Standardized Food Truck)**: Docker packs the entire restaurant—including the kitchen equipment (Node.js), the safety rules, and the ingredient pantry—into a single food truck. This means you can drive this truck to any city (any developer's computer) and it will cook the exact same food without any setup problems.
- **Node.js & Express (The Waiters & Order Desks)**: Node.js is like a super-fast waiter, and Express is the system of ordering desks. Together, they quickly receive customer requests (like "I want to place a bid"), send them to the correct part of the kitchen, and bring back the response to the customer immediately.
- **TypeScript (The Kitchen Safety Manual)**: TypeScript is the restaurant's strict health and safety guide. It makes sure that every ingredient (data) is exactly the right type, size, and quality before a cook touches it, preventing dangerous mistakes (runtime errors).
- **PostgreSQL & Sequelize ORM (The Locked Pantry & Smart Assistant)**: PostgreSQL is the heavy-duty, locked pantry where all the important items (users, bids, wallets) are kept safe. Sequelize is our smart kitchen assistant (ORM). Instead of making the chef write long, difficult instructions in a special language (SQL) to find an ingredient, we just tell the assistant what we need in plain terms, and it handles the pantry work safely.

in this restaurant, the **MVC pattern** is the organizational layout that divides the daily work. It separates the tasks between the ingredient pantry (Model), the plate presentation department (View), and the front-of-house manager (Controller) to keep the service running perfectly

#### **The Architectural Pattern (MVC)

To organize our codebase and separate different responsibilities, the application is built strictly around the **Model-View-Controller (MVC)** pattern:

- **Middlewares** (`/src/middleware/`):
  - **General Definition**: Middlewares are intermediate functions that intercept incoming HTTP requests before they reach the main controller logic.
  - **Role in our MVC Pattern**: They act as security guards and data validators at the entry point of the route handler. They run sequentially to analyze request headers and request body payloads.
  - **Goal in our Project**: To verify that the user is logged in (via JWT authorization check), has the correct permissions (Role-Based Access Control, like checking if they are an `admin` or a `bid-creator`), and has submitted valid data formats (Zod request body schema validation). This prevents bad or insecure requests from ever touching our business logic.

- **Controllers** (`/src/controllers/`):
  - **General Definition**: Controllers contain the main business logic and act as managers that coordinate the flow of data within the application.
  - **Role in our MVC Pattern**: They take the cleaned request inputs from the middlewares, determine what needs to be done, invoke the correct state handlers or bidding strategies (State/Strategy Patterns), and interact with models to fetch or update data.
  - **Goal in our Project**: To coordinate all actions when placing a bid, creating a catalog item, scheduling an auction, or closing a finished auction, ensuring all rules are respected.

- **Models** (`/src/models/`):
  - **General Definition**: Models define the structure of the database tables, relations between tables, and the methods used to fetch or save records.
  - **Role in our MVC Pattern**: They represent the database layer. In our code, we define models using Sequelize ORM classes that map directly to PostgreSQL tables.
  - **Goal in our Project**: To manage persistent records of users, wallets, catalog goods, auctions, bids, and receipts, ensuring the database schema is correctly defined and queries are executed safely.

- **Views** (`/src/views/`):
  - **General Definition**: In traditional web development, a view is the visual interface (HTML/CSS). However, in a **backend-only REST API**, the view's job is to format and filter the raw data into JSON objects before sending them as responses back to the client.
  - **Role in our MVC Pattern**: They package the database model outputs into clean, filtered Data Transfer Objects (DTOs) for the client.
  - **Goal in our Project**: To protect privacy and enforce rules. For example, during active sealed auctions, the View's filter dynamically masks the bid amounts and bidder details by setting them to `null` in the JSON response, ensuring copycat bidding is prevented.

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

- **Brief Definition**: Instead of writing a single large function with multiple nested `if/else` or `switch` statements to handle different business rules (what abstract definitions call a "family of algorithms"), this pattern defines a single interface (contract). You then write separate classes implementing this interface for each rule set, allowing you to swap between them at runtime depending on the input.

- **Brief Analogy**: Think of a camera app on your phone. You can switch between "Portrait Mode", "Night Mode", or "Video Mode". The camera is the same, but the way it takes the picture changes based on the mode you choose.
- **How we apply it in our app**: The controller [bidController.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/controllers/bidController.ts) handles bid placement. Instead of containing raw conditional statements for each auction style, it delegates validation and resolution to a strategy resolved via [AuctionStrategyFactory.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/factories/AuctionStrategyFactory.ts). The concrete classes [EnglishAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/strategies/EnglishAuctionStrategy.ts) and [SealedBidAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/strategies/SealedBidAuctionStrategy.ts) implement a shared `AuctionResolutionStrategy` interface. This interface declares the `validateBid()` and `resolve()` methods, making the bidding rules interchangeable.

#### **2. State Pattern (Auction State Transitions: DRAFT, SCHEDULED, RUNNING, etc.)**

- **Brief Definition**: This pattern avoids complex conditional checks by representing each state of an object (e.g., status string in a database) as a separate class implementing a common interface. The main class delegates its method calls (like placing a bid or cancelling) to the active state class instance, which changes dynamically as the status changes.

- **Brief Analogy**: Think of a simple vending machine. If it is in the "No Money" state, pressing the buttons does nothing. If it is in the "Money Inserted" state, pressing the buttons dispenses a drink.
- **How we apply it in our app**: The controller [auctionController.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/controllers/auctionController.ts) performs state transitions (like scheduling or starting an auction). Rather than using standard `switch-case` blocks on the status string, it retrieves the state handler using `getAuctionState(auction)` from [src/states/index.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/index.ts). The concrete state classes—[DraftState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/DraftState.ts), [ScheduledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/ScheduledState.ts), [RunningState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/RunningState.ts), [ClosedState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/ClosedState.ts), and [CancelledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/states/CancelledState.ts)—implement the `AuctionState` interface to restrict actions (e.g., throwing an error in `ClosedState.placeBid()`).

#### **3. Observer Pattern (Real-time updates via WebSockets)**

- **Brief Definition**: This pattern establishes a push-based notification system between a source class (the Subject) and multiple listening clients (the Observers). When a state change or event occurs in the source class, it loops through all registered observers to call a callback function or push a network packet (like WebSockets) to notify them automatically.

- **Brief Analogy**: Think of subscribing to a YouTube channel. When the creator uploads a new video, YouTube automatically sends a notification to all subscribed followers.
- **How we apply it in our app**: We use WebSockets to push live updates. The setup in [websocket.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/config/websocket.ts) acts as the Subject/Broadcaster. When a bid is successfully placed or the auction closes, the system broadcasts updates (like `BID_PLACED` or `AWARD_COMPLETED` events) to all subscribed socket clients connected to the specific auction room, ensuring all participants see the new price or winner instantly.

#### **4. Facade Pattern (Wrapping winner resolution and database transactions in one simple API)**

- **Brief Definition**: This pattern acts as a high-level wrapper class or function. It packages a complex sequence of multiple low-level method calls, database queries, and helper functions into a single, clean API endpoint or method, hiding the complexity from the caller.

- **Brief Analogy**: Think of ordering a book with a "Buy Now" button. You click one button, but behind the scenes, the system checks stock, charges your bank, alerts the delivery company, and updates the database.
- **How we apply it in our app**: Resolving an auction involves multiple database and file system operations. We encapsulate these operations inside [AuctionResolutionFacade.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/facades/AuctionResolutionFacade.ts). When called by [auctionScheduler.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/jobs/auctionScheduler.ts) or controllers, the Facade handles the complex transaction workflow: executing the strategy `resolve()` method, locking/fetching the winner's wallet (`SELECT FOR UPDATE`), subtracting the tokens, generating the PDF receipt via [pdfReceiptHelper.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/helpers/pdfReceiptHelper.ts), saving all changes inside a Sequelize transaction, and broadcasting the WS event.

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

- **`POST /api/v1/auth/register`**
  - *Purpose*: Register a new user profile.
  - *Constraints & Payload Validation*:
    - `username`: String (Min 3, Max 50 characters, required).
    - `email`: String (Must be a valid email format, required).
    - `password`: String (Min 8 characters, must contain at least one uppercase letter and at least one number, required).
    - `role`: Enum (`admin`, `bid-creator`, `bid-participant`, optional, defaults to `bid-participant`).
  - *Example Payload*:

    ```json
    {
      "username": "hassen",
      "email": "hassen@example.com",
      "password": "SecurePassword123",
      "role": "bid-participant"
    }
    ```

  - *Model Operations*: Inserts a record in the `Users` table and automatically creates an associated `Wallet` record preloaded with 10,000 tokens for participants.
  - *Authorization*: Public.

- **`POST /api/v1/auth/login`**
  - *Purpose*: Authenticate user credentials and return a secure JWT access token.
  - *Constraints & Payload Validation*:
    - `email`: String (Must be a valid email format, required).
    - `password`: String (Required).
  - *Example Payload*:

    ```json
    {
      "email": "hassen@example.com",
      "password": "SecurePassword123"
    }
    ```

  - *Model Operations*: Queries `Users` table to verify credentials.
  - *Response*: Returns a JWT signed with RS256 containing user metadata (`id`, `role`).
  - *Authorization*: Public.

##### **2. Goods Catalog Management**

- **`POST /api/v1/goods`**
  - *Purpose*: Create a new item/lot in the system catalog.
  - *Constraints & Payload Validation*:
    - `name`: String (Min 2, Max 200 characters, required).
    - `description`: String (Min 10 characters, required).
    - `category`: String (Min 2, Max 100 characters, required).
    - `basePrice`: Positive number (greater than 0, required).
  - *Example Payload*:

    ```json
    {
      "name": "Vintage Watch",
      "description": "1960s mechanical chronograph in working condition.",
      "category": "Antiques",
      "basePrice": 150.00
    }
    ```

  - *Model Operations*: Inserts a record into the `Goods` table.
  - *Authorization*: Authorized: `bid-creator` only (must present valid JWT).

- **`GET /api/v1/goods`**
  - *Purpose*: Retrieve a list of all catalog goods.
  - *Constraints*: None (supports optional query filtering by `?category=...`).
  - *Model Operations*: Queries the `Goods` table.
  - *Authorization*: Public (anyone can read the catalog).

##### **3. Auction Lifecycle Management**

- **`POST /api/v1/auctions`**
  - *Purpose*: Schedule a new auction linked to a catalog item.
  - *Constraints & Payload Validation*:
    - `goodUuid`: String (Must be a valid UUID, required).
    - `type`: Enum (`ENGLISH`, `SEALED_BID`, required).
    - `startingPrice`: Positive number (greater than 0, required).
    - `minimumIncrement`: Positive number (greater than 0, optional, defaults to 1).
    - `startAt`: ISO Datetime string (required).
    - `endAt`: ISO Datetime string (must be after `startAt`, required).
  - *Example Payload*:

    ```json
    {
      "goodUuid": "e7b0c95d-7a54-47a8-9d51-40efb8bdfb04",
      "type": "ENGLISH",
      "startingPrice": 180.00,
      "minimumIncrement": 10.00,
      "startAt": "2026-07-20T12:00:00.000Z",
      "endAt": "2026-07-22T12:00:00.000Z"
    }
    ```

  - *Model Operations*: Verifies that the good exists and is available, then inserts an `Auctions` record with default state `DRAFT`.
  - *Authorization*: Authorized: `bid-creator` only (must present valid JWT).

- **`GET /api/v1/auctions`**
  - *Purpose*: Display all auctions.
  - *Constraints*: Optional query filtering by `?state=[DRAFT|SCHEDULED|RUNNING|CLOSED|CANCELLED]` and `?type=[ENGLISH|SEALED_BID]`.
  - *Model Operations*: Queries `Auctions` joined with the `Goods` model.
  - *Authorization*: Public.

- **`PATCH /api/v1/auctions/:uuid/state`**
  - *Purpose*: Transition the state of an auction.
  - *Constraints & Payload Validation*:
    - `action`: Enum (`schedule`, `start`, `close`, `cancel`, required).
  - *Example Payload*:

    ```json
    {
      "action": "schedule"
    }
    ```

  - *Model Operations*: Invokes state transitions on the auction. Starting/closing updates states and triggers WebSocket broadcasts. Closing utilizes the strategy to resolve winners, lock and deduct wallets, and write a receipt in a single transaction.
  - *Authorization*: Authorized: `bid-creator` (owner of the auction) or `admin`.

##### **4. Bidding Operations**

- **`POST /api/v1/auctions/:uuid/bids`**
  - *Purpose*: Place a bid on an active running auction.
  - *Constraints & Payload Validation*:
    - `amount`: Positive number (greater than 0, required). Must be higher than the current highest bid + minimum increment (for English auctions) or exceed the starting price (for Sealed-Bid auctions).
  - *Example Payload*:

    ```json
    {
      "amount": 250.00
    }
    ```

  - *Model Operations*: Verifies auction state is `RUNNING` and participant's wallet balance is sufficient. Creates a `Bid` record and triggers real-time socket broadcasts.
  - *Authorization*: Authorized: `bid-participant` only (must present valid JWT).

- **`GET /api/v1/auctions/:uuid/bids`**
  - *Purpose*: View bidding increments and history.
  - *Authorization*:
    - **English Auctions**: Public.
    - **Sealed-Bid Auctions**: Anonymous/participants see bids and bidders masked (`null`) until state is `CLOSED`. Admins and the auction creator can view unmasked details.

##### **5. Wallet and Balance Management**

- **`GET /api/v1/wallet/balance`**
  - *Purpose*: Check current remaining token balance.
  - *Model Operations*: Queries `Wallet` record linked to caller's user ID.
  - *Authorization*: Authorized: `bid-participant` only.

- **`GET /api/v1/admin/wallet/info`**
  - *Purpose*: Retrieve wallet details (UUID, username, and token balance) for all users in the system.
  - *Model Operations*: Queries the `Users` table joined with the `Wallets` table.
  - *Authorization*: Authorized: `admin` only (must present valid JWT).

- **`POST /api/v1/admin/wallet/recharge`**
  - *Purpose*: Credit/replenish user's wallet with tokens.
  - *Constraints & Payload Validation*:
    - `userUuid`: String (Must be a valid UUID, required).
    - `amount`: Positive number (greater than 0, required).
  - *Example Payload*:
    ```json
    {
      "userUuid": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c",
      "amount": 500.00
    }
    ```
  - *Model Operations*: Updates the balance column of the target wallet.
  - *Authorization*: Authorized: `admin` only (must present valid JWT).

##### **6. User History & PDF Receipts**

- **`GET /api/v1/users/me/auctions`**
  - *Purpose*: Browse user's history of bid participations.
  - *Constraints*: Optional query filters `?filter=[all|won|lost]`, `?startDate=ISO`, and `?endDate=ISO`.
  - *Model Operations*: Queries bids and victories for the caller.
  - *Authorization*: Authorized: `bid-participant` or `admin`.

- **`GET /api/v1/users/me/spending`**
  - *Purpose*: View total tokens spent within a given timeframe.
  - *Constraints*: Optional query filters `?startDate=ISO` and `?endDate=ISO`.
  - *Model Operations*: Aggregates receipts' `amountPaid` for won auctions.
  - *Authorization*: Authorized: `bid-participant` or `admin`.

- **`GET /api/v1/auctions/:uuid/receipt`**
  - *Purpose*: Generate and download the PDF receipt of a won auction.
  - *Storage Behavior*: **Dynamically generated in-memory on-the-fly** as a PDFKit stream and piped to the response (never saved on the server's hard disk).
  - *Authorization*: Authorized: The winning participant or `admin`.

##### **7. Statistics**

- **`GET /api/v1/admin/statistics`**
  - *Purpose*: Extract system-wide financial and participation metrics.
  - *Constraints*: Optional query filters `?startDate=ISO` and `?endDate=ISO`.
  - *Model Operations*: Aggregates count of auctions and avg/min/max participants per type.
  - *Authorization*: Authorized: `admin` only.

---

#### **3.4.2 API Authentication Mechanics**

##### **What is Authentication?**

Authentication is the process of verifying a user's identity. In a REST API, when a user registers or logs in with their credentials (username/email and password), the server verifies who they are. Once verified, the server generates a token (JWT) to identify them on future requests, avoiding the need for the user to resend their password with every single action.

##### **What is a JWT (JSON Web Token)?**

A JSON Web Token (JWT) is a compact, secure string used to transmit user identity information between the client and the server. A JWT has three parts:

1. **Header**: Specifies the token type and signing algorithm (e.g., RS256).
2. **Payload**: Contains the encoded user claims (e.g., `userId` and `role`).
3. **Signature**: Verifies that the token was signed by the server and hasn't been tampered with.

##### **What are the Public and Private Keys (`public.pem` / `private.pem`)?**

This project uses **Asymmetric Cryptography** (specifically the **RS256** algorithm) to sign and verify tokens:

- **Private Key (`keys/private.pem`)**: This key is kept **secret** on the server. The server uses it to write a digital signature when creating the JWT.
- **Public Key (`keys/public.pem`)**: This key is public. The server uses it to read the digital signature and verify that the token is authentic.

##### **Do these keys give users their roles?**

**No, the keys themselves do not give or assign roles to users.**
Instead, they **protect** the role information inside the token:

1. When a user logs in, the server checks the user's role in the Postgres database (e.g., `admin`).
2. The server creates a token containing the role `admin` and signs it using the **Private Key**.
3. For future requests, when the client presents the token, the server checks the signature using the **Public Key** to ensure it matches.
4. If a client attempts to modify the token payload (for example, trying to change their role from `bid-participant` to `admin` in Postman), the signature becomes invalid because the client does not have the Private Key to sign the new role. The server immediately rejects the request with a `401 Unauthorized` status.

> [!NOTE]
> **Key vs. Token Distinction**:
>
> - **The Keys (in `.env`)** are role-less cryptographic parameters used globally by the server to sign and verify all tokens. You configure them once at startup.
> - **The Tokens (passed in HTTP headers)** are user-specific credentials containing specific roles (e.g. `admin`, `bid-creator`, or `bid-participant`). They are generated on login to authorize individual API requests.

##### **Security Risks of Path-Based Authentication**

Putting user IDs or tokens directly in URLs (e.g., `/api/v1/goods/:userId` or `/api/v1/goods/:jwt`) creates severe security issues:

- **Server Log Leaks**: HTTP servers (like Nginx, Apache, or load balancers) write complete URL paths in plain-text logs. This would expose active tokens.
- **Browser Cache**: URL routes are saved in browser history, bookmarks, and caching proxies.
- **Referrer Leaks**: Clicking external links forwards the full URL (containing the token) to external sites in the `Referer` header.

##### **The Bearer Token Pattern**

To securely identify users, we use the standard **Bearer Token** pattern in the HTTP `Authorization` header. /n The token is sent inside the headers rather than the URL:

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

- **Analogy**: Imagine traveling to an airport. You can choose different transportation strategies: taking a bus, taking a taxi, or riding a bicycle. You change your strategy based on your budget and time, but your final destination (the airport) remains the same.
- **Benefits**: It makes it extremely easy to add or change algorithms without editing the main code. This follows the **Open/Closed Principle (OCP)**, which means that the code is open for extension (you can add new auction behaviors easily) but closed for modification (you do not need to change the existing, tested logic, which prevents introducing new bugs).

#### **2. Why We Used It (Justification)**

Our system supports two different types of auctions:

- **English Auction**: Validates that each new bid is higher than the current highest bid plus a minimum increment.
- **Sealed Bid Auction**: Participants place hidden bids, which are validated only against the starting price.

**Instead of using complex `if/else` or `switch` blocks inside our bidding routes—which would couple our API controllers to specific business rules and make testing difficult—we isolate each validation and win-determination algorithm into its own strategy class.**

This is a direct application of the **Open/Closed Principle (OCP)**:

1. **Open for Extension**: If we want to add a third type of auction in the future (such as a *Dutch Auction* or a *Vickrey Auction*), we simply write a new strategy class.
2. **Closed for Modification**: We do not need to edit or re-test any of the existing controllers, database query routes, or logic in `EnglishAuctionStrategy` or `SealedBidAuctionStrategy`. This completely eliminates the risk of bugs into working code when adding new auction types.

#### **3. How We Implement This Pattern**

- **Folder Location**: `src/patterns/strategy/`

- **Core Interfaces & Files**:
  - [BiddingStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/BiddingStrategy.ts): Defines the common contract interface `BiddingStrategy` with methods like `validateBid` and `determineWinner`.
  - [EnglishAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/EnglishAuctionStrategy.ts): Implements the ascending English auction validation logic.
  - [SealedBidAuctionStrategy.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/strategy/SealedBidAuctionStrategy.ts): Implements the blind/sealed-bid validation logic.
- **Execution Context**: The bidding route controller dynamically selects the correct strategy using `StrategyFactory.ts` based on the auction type database key.

---

### 2. State Pattern

#### **1. Definition and Description**

The State Pattern is a behavioral design pattern that allows an object to change its behavior when its internal state changes. It looks as if the object changed its class.

- **Analogy**: Consider a vending machine. When it is empty (Out of Stock state), pushing buttons does nothing. When it has items but no coins (No Coin state), pushing buttons tells you to insert money. When you insert money (Has Coin state), pushing buttons dispenses soda. The machine responds differently to the exact same button push based on its current state.
- **Benefits**: It replaces massive conditional logic (nested `if/else` or `switch` blocks) with simple polymorphic calls.

#### **2. Why We Used It (Justification)**

An auction transitions through multiple phases: `DRAFT`, `SCHEDULED`, `RUNNING`, `CLOSED`, and `CANCELLED`.
Operations like placing a bid or updating details are only valid in certain states. For example:

- Placing a bid is only permitted in the `RUNNING` state.
- Editing scheduled times is only permitted in the `DRAFT` or `SCHEDULED` state.
Instead of writing messy condition guards in our controllers, we delegate actions directly to a state instance. The state handles its own transitions and behavior, keeping the controllers clean.

#### **3. How We Implement This Pattern**

- **Folder Location**: `src/patterns/state/`

- **Core Interfaces & Files**:
  - [AuctionState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/AuctionState.ts): Defines the base abstract class or interface `AuctionState` with methods like `placeBid()`, `start()`, and `close()`.
  - Concrete State Classes:
    - [DraftState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/DraftState.ts): Blocks bids, allows edits.
    - [ScheduledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/ScheduledState.ts): Blocks bids, allows starting.
    - [RunningState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/RunningState.ts): Directs bids to the active Strategy validator.
    - [ClosedState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/ClosedState.ts) & [CancelledState.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/state/CancelledState.ts): Block all mutations.

---

### 3. Observer Pattern

#### **1. Definition and Description**

The Observer Pattern is a design pattern where an object (the subject) maintains a list of dependents (observers) and notifies them automatically of any state changes, usually by calling one of their methods.

- **Analogy**: Think of a newspaper subscription. Instead of you walking to the newsstand every hour to check if a new paper has been printed (polling), you subscribe to the newspaper publisher. The publisher delivers the paper to your mailbox as soon as it is printed (broadcast).
- **Benefits**: It decouples the state publisher from its consumers, supporting event-driven real-time updates.

#### **2. Why We Used It (Justification)**

During a live auction, participants need to see bids and price changes instantly to make decisions. Without observers, clients would have to make HTTP requests every few seconds (polling), which degrades database performance. Using this pattern, when a new bid is saved, the system automatically triggers broadcasts to all active websocket connection observers.

#### **3. How We Implement This Pattern**

- **Folder Location**: `src/socket/`

- **Core Interfaces & Files**:
  - [WebSocketManager.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/socket/WebSocketManager.ts): Serves as the central publisher/subject. It registers active user connection sockets as observers.
  - When a bid is successfully saved, `wsManager.broadcastToAuction()` is called to notify all connected client observers instantly.

---

### 4. Facade Pattern

#### **1. Definition and Description**

The Facade Pattern is a structural design pattern that acts as a single, simple entrance to a larger and more complicated system. Instead of making your application interact directly with many different folders, database queries, and helper services, you create a wrapper class (the Facade). This class exposes one easy-to-use method that runs all the complex steps behind the scenes in the correct order, hiding the internal complexity from the rest of the application.

- **Analogy**: Consider placing an order on Amazon. You simply click a single "Buy Now" button (the Facade). Behind the scenes, Amazon's backend must check warehouse inventory, charge your credit card, update the shipping queue, generate a PDF invoice, and email you a receipt. You don't interact with these sub-modules directly; the facade coordinates them for you.
- **Benefits**: Simplifies code complexity for clients and isolates critical step-by-step transaction operations.

#### **2. Why We Used It (Justification)**

When an auction closes, multiple actions must run together:

1. Determine the winner.
2. Deduct tokens from the winner's wallet.
3. Transfer credits to the creator's balance.
4. Set the auction state to `CLOSED`.
5. Generate a formal PDF receipt.
If one step fails (e.g., token transfer fails), the whole sequence must rollback. The Facade orchestrates all these steps inside a single Sequelize database transaction block, preventing data corruption.

#### **3. How We Implement This Pattern**

- **Folder Location**: `src/patterns/facade/`

- **Core Interfaces & Files**:
  - [AuctionResolutionFacade.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/patterns/facade/AuctionResolutionFacade.ts): Exposes the simplified `resolveAuction(auctionId)` method. It imports the database connection, the PDF generator service, and the Wallet models, executing the complete closure sequence safely inside an SQL transaction block.

---

### 5. Singleton Pattern

#### **1. Definition and Description**

The Singleton Pattern is a creational design pattern that guarantees a class has only one single instance throughout the application lifecycle, and provides a global access point to it.

- **Analogy**: A town's official land registry office. There should only be one official registry office database to avoid conflicting land ownership records. Any person requesting records or registering land goes to this single office.
- **Benefits**: Restricts constructor access, preventing resource leaks and ensuring a single unified state.

#### **2. Why We Used It (Justification)**

Certain classes consume heavy system resources or manage global connections:

- **Sequelize Connection**: Creating multiple database connection pools would exhaust Postgres port allocation and crash the server.
- **WebSocket Server**: Having multiple websocket managers would split connections, meaning some users wouldn't receive updates.
Implementing the Singleton pattern ensures these wrappers are initialized only once.

#### **3. How We Implement This Pattern**

- **Files and Folders**:
  - Database: [src/config/database.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/config/database.ts) declares a `private constructor()` and static `getInstance()` to manage and export the single shared Sequelize instance.
  - WebSockets: [src/socket/WebSocketManager.ts](file:///C:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/socket/WebSocketManager.ts) implements `private static instance: WebSocketManager` and exposes `getInstance()`.

---

## 🗄️ 6. Principal Data Model

### 6.1 Table Schema Details

#### 1. Users Table

Stores credentials and role identifiers.

- `id` (BIGINT, Primary Key, auto-increment)
- `uuid` (UUID, Unique, indexed)
- `username` (VARCHAR(255), Unique)
- `email` (VARCHAR(255), Unique)
- `password` (VARCHAR(255), stores bcrypt hashes)
- `role` (ENUM('admin', 'bid-creator', 'bid-participant'))

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`username`** | `VARCHAR(255)` | `NOT NULL` | `UNIQUE` | Unique account nickname |
| **`email`** | `VARCHAR(255)` | `NOT NULL` | `UNIQUE` | Unique login email string |
| **`password`** | `VARCHAR(255)` | `NOT NULL` | - | Salted bcrypt hash string |
| **`role`** | `VARCHAR(50)` | `NOT NULL` | - | `ENUM('admin', 'bid-creator', 'bid-participant')` |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

#### 2. Wallets Table

Maintains participant credit tokens.

- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `userId` (BIGINT, Foreign Key referencing Users.id)
- `balance` (DECIMAL(15,2), Default 0.00, check constraint `balance >= 0.00`)

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`userId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Users.id` (1-to-1 relationship link) |
| **`balance`** | `DECIMAL(15,2)` | `NOT NULL` | `CHECK (balance >= 0.00)` | `0.00` (Credit token balance constraint) |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

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

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`name`** | `VARCHAR(200)` | `NOT NULL` | - | Item title |
| **`description`** | `TEXT` | `NULL` | - | Long-form descriptive text |
| **`category`** | `VARCHAR(100)` | `NULL` | - | Classification tag |
| **`basePrice`** | `DECIMAL(15,2)` | `NOT NULL` | `CHECK (basePrice > 0.00)` | Starting value threshold validation |
| **`isAvailable`** | `BOOLEAN` | `NOT NULL` | - | `true` (Flags if catalog lot is currently unassigned) |
| **`createdBy`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Users.id` (Authorizing lot creator link) |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

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

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`goodId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Goods.id` (Mapped catalog lot item) |
| **`createdBy`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Users.id` (Bidding coordinator link) |
| **`type`** | `VARCHAR(50)` | `NOT NULL` | - | `ENUM('ENGLISH', 'SEALED_BID')` (Dynamic Strategy) |
| **`state`** | `VARCHAR(50)` | `NOT NULL` | - | `ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'CLOSED', 'CANCELLED')` |
| **`startingPrice`** | `DECIMAL(15,2)` | `NOT NULL` | - | Opening bid value |
| **`minimumIncrement`** | `DECIMAL(15,2)` | `NOT NULL` | - | `1.00` (Required English bid raise increment) |
| **`startAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | Scheduled execution start time |
| **`endAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | Scheduled execution end time |
| **`winnerId`** | `BIGINT` | `NULL` | `FOREIGN KEY` | References `Users.id` (Resolved winning bidder) |
| **`winningBidId`**| `BIGINT` | `NULL` | `FOREIGN KEY` | References `Bids.id` (Highest successful offer) |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

#### 5. Bids Table

Records the offers placed.

- `id` (BIGINT, Primary Key)
- `uuid` (UUID, Unique, indexed)
- `auctionId` (BIGINT, Foreign Key referencing Auctions.id)
- `bidderId` (BIGINT, Foreign Key referencing Users.id)
- `amount` (DECIMAL(15,2))

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`auctionId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Auctions.id` (Target bidding session) |
| **`bidderId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Users.id` (Placing participant) |
| **`amount`** | `DECIMAL(15,2)` | `NOT NULL` | - | Financial value of the placed offer |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation/bidding timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

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

| Column Name | Data Type | Nullability | Constraints / Keys | Default / Extra Details |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `BIGINT` | `NOT NULL` | `PRIMARY KEY` | `AUTO_INCREMENT` (Internal sequencing key) |
| **`uuid`** | `UUID` | `NOT NULL` | `UNIQUE`, `INDEX` | `UUID_GENERATE_V4()` (Public-facing API handle) |
| **`auctionId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Auctions.id` (Won bidding session) |
| **`winnerId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Users.id` (Recipient participant) |
| **`bidId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Bids.id` (Winning offer reference) |
| **`goodId`** | `BIGINT` | `NOT NULL` | `FOREIGN KEY` | References `Goods.id` (Acquired catalog lot) |
| **`amountPaid`** | `DECIMAL(15,2)` | `NOT NULL` | - | Final transaction value deducted |
| **`transactionId`**| `UUID` | `NOT NULL` | `UNIQUE` | `UUID_GENERATE_V4()` (Payment gateway transaction ID) |
| **`awardedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Award timestamp) |
| **`createdAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Creation timestamp) |
| **`updatedAt`** | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | - | `NOW()` (Last modification timestamp) |

### 6.2 Model Relationships

<div align="center">
  <img src="./assets/Model%20Relationship%20%20in%20Detail.png" width="650" alt="Model Relationship in Detail">
</div>

The entity relationships are configured via Sequelize associations to enforce relational integrity and optimize queries:

#### 1. User 1-to-1 Wallet

- **Sequelize Association**:

  ```typescript
  User.hasOne(Wallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Wallet.belongsTo(User, { foreignKey: 'userId' });
  ```

- **Justification & Explanation**: We separate user account details from wallet balances to keep the code clean and organized. The authentication system does not need to load financial data when a user simply logs in, which saves computer memory. Also, we set a cascade rule so that if a user deletes their account, their wallet is automatically deleted too, preventing empty database records.

#### 2. Good 1-to-Many Auction

- **Sequelize Association**:

  ```typescript
  Good.hasMany(Auction, { foreignKey: 'goodId', onDelete: 'CASCADE' });
  Auction.belongsTo(Good, { foreignKey: 'goodId' });
  ```

- **Justification & Explanation**: A catalog item (like a physical good) might fail to sell, get cancelled, or need to be auctioned again later. Using a 1-to-Many relationship allows the system to save the history of all auctions linked to that item, instead of limiting the item to just one single auction.

#### 3. User 1-to-Many Auction (as Creator)

- **Sequelize Association**:

  ```typescript
  User.hasMany(Auction, { foreignKey: 'creatorId', as: 'createdAuctions' });
  Auction.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
  ```

- **Justification & Explanation**: Only authorized users can create and manage auctions. We save the creator's ID on each auction. This allows the security system (middleware) to verify that only the original creator of the auction (or an administrator) has the permission to start, cancel, or close it.

#### 4. Auction 1-to-Many Bid

- **Sequelize Association**:

  ```typescript
  Auction.hasMany(Bid, { foreignKey: 'auctionId', onDelete: 'CASCADE' });
  Bid.belongsTo(Auction, { foreignKey: 'auctionId' });
  ```

- **Justification & Explanation**: During an auction, many participants place bids to raise the price. For blind/sealed-bid auctions, we also store multiple hidden bids. We need a 1-to-Many relationship so that when the auction ends, the database can easily look at all the bids for that specific auction and find the winner (the highest bidder).

#### 5. User 1-to-Many Bid

- **Sequelize Association**:

  ```typescript
  User.hasMany(Bid, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Bid.belongsTo(User, { foreignKey: 'userId' });
  ```

- **Justification & Explanation**: This records a history of all bids placed by a single user across different auctions. It allows users to check their own bidding history and helps the system verify if they have enough wallet tokens before they submit a new bid.

#### 6. Auction 1-to-1 Receipt

- **Sequelize Association**:

  ```typescript
  Auction.hasOne(Receipt, { foreignKey: 'auctionId', onDelete: 'RESTRICT' });
  Receipt.belongsTo(Auction, { foreignKey: 'auctionId' });
  ```

- **Justification & Explanation**: Legally, a closed auction can only have one final receipt for the winner. The 1-to-1 rule ensures that the system can never create duplicate receipts or payments for the same auction, which prevents fraud. We also use a restrict rule to prevent anyone from deleting an auction's history once a receipt has been created, protecting our billing records.

#### 7. User 1-to-Many Receipt (as Winner)

- **Sequelize Association**:

  ```typescript
  User.hasMany(Receipt, { foreignKey: 'winnerId', as: 'wonReceipts' });
  Receipt.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });
  ```

- **Justification & Explanation**: This allows the buying participant to view a list of all the auctions they have won, check how many tokens they have spent over time, and download their PDF invoices/receipts.

---

### 6.3 Database Keys: Auto-Incrementing IDs vs. UUIDs

When designing the database schema, choosing the right Primary Key strategy is critical for balancing system performance and API security. Below is the technical breakdown, trade-offs, and the hybrid architectural solution adopted for this project.

#### 1. Technical Comparison

| Metric / Aspect | Auto-Incrementing Integer (`id`) | UUID (Universally Unique Identifier) |
| :--- | :--- | :--- |
| **Storage Size** | 4 bytes (`INT`) or 8 bytes (`BIGINT`) | 16 bytes (128-bit) |
| **Read/Write Performance** | Extremely fast (small indexes, sequential inserts) | Slower (larger indexes, random insert fragmentation) |
| **Clustered Index Friendly** | High (naturally ordered, no page splits) | Low (random UUIDv4 triggers frequent page splits) |
| **Security (Obscurity)** | Poor (subject to ID enumeration attacks) | High (unguessable random entropy) |
| **Distributed Scaling** | Difficult (requires central generator coordination) | Excellent (can be generated client-side offline) |
| **Business Data Privacy** | Poor (leaks total register counts to competitors) | High (reveals zero metrics about company scale) |

#### 2. Architectural Recommendation: The Hybrid Approach

To capture the advantages of both strategies while eliminating their respective weaknesses, we implement a **Hybrid Key Strategy**:

- **Internal Database Keys (`id`)**:
  - **Implementation**: Every table uses a sequential `BIGINT` Primary Key named `id` internally.
  - **Use Case**: All Sequelize associations, foreign key constraints, and index joins query these integer columns.
  - **Justification**: Keeps table index sizing minimal, maximizes query join performance, and aligns write operations with PostgreSQL physical memory structures.

- **External Public Keys (`uuid`)**:
  - **Implementation**: Tables exposed to API endpoints (like `Users`, `Auctions`, and `Receipts`) feature a secondary `uuid` column with a unique index.
  - **Use Case**: All public API routes identify resources using this UUID (e.g., `/api/v1/auctions/395a15fd-c735-80fc-b03d-cc799e3c1085`).
  - **Justification**: Fully mitigates ID enumeration attacks (users cannot guess sequential IDs) and blocks leakage of business metrics via sequential numbers.

- **Execution Workflow**:
  1. The client issues a request: `GET /api/v1/auctions/395a15fd-c735-80fc-b03d-cc799e3c1085`.
  2. The Express Controller intercepts the request, queries `Auction.findOne({ where: { uuid: req.params.uuid } })`, retrieves the internal integer `id` (e.g., `42`), and processes downstream business operations internally using this highly performant numeric key.

### 6.4 Database Indexes: Optimization & Constraints

<div align="center">
  <img src="./assets/indexes.png" width="800" alt="Database Indexes in DBeaver">
</div>

#### **1. What is a Database Index?**

An **Index** is an auxiliary data structure (typically a B-Tree in PostgreSQL) that stores a sorted copy of specific columns along with pointers to the actual rows in the table.
- **Analogy**: Imagine a thick physical book about history. If you want to find every page that mentions *"Julius Caesar"*, you don't read the entire book cover-to-cover (which is a database **Full Table Scan**). Instead, you turn to the **Index** at the back, find *"Caesar, Julius"*, see the listed page numbers (pointers), and flip directly to those pages.

#### **2. Why We Use Indexes**

We implement indexes to achieve two main goals in this project:

1. **Accelerate Query Performance:** When filtering, ordering, or joining data (e.g. `WHERE state = 'RUNNING'` or joining `Bids` to `Auctions` on `auctionId`), an index allows the database to locate matching rows in milliseconds instead of scanning millions of records.
2. **Enforce Data Integrity (Constraints):** Unique indexes guarantee that duplicate data cannot be written to the database (e.g. preventing two users from registering with the exact same `email` or having duplicate `uuid` handles).

#### **3. How Indexes are Implemented in this Project**

In this backend, indexes are declared directly within our Sequelize models under the `indexes` option array of the model initialization:

##### **A. Unique Indexes**

Unique indexes are placed on columns that are used as public identifiers or sensitive credentials to prevent duplicate entries and speed up lookup:
- **UUID Lookup Fields:** Every model exposes resources via a public `uuid` column. A unique index is defined on these fields to resolve queries instantly (e.g., `User.uuid`, `Auction.uuid`, `Good.uuid`, `Bid.uuid`, `Receipt.uuid`, `Wallet.uuid`).
- **Authentication Credentials:** [User.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/models/User.ts#L73) defines a unique index on `email` to quickly verify and authenticate credentials during login.

##### **B. Performance/Filter Indexes (Non-Unique)**

Non-unique indexes are defined on columns that are frequently filtered, sorted, or joined in foreign key associations:
- **Auctions Table:** [Auction.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/models/Auction.ts#L129-L138) indexes columns like `state` (for listing active auctions), `type` (filtering by English vs. Sealed-bid), `goodId`/`createdBy` (foreign key joins), and `startAt`/`endAt` (for cron scheduling checks).
- **Bids Table:** [Bid.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/models/Bid.ts#L63-L69) indexes `auctionId` and `bidderId` separately, and also defines a **composite index** on `['auctionId', 'bidderId']` to optimize queries fetching bids placed by a specific participant in a specific auction.
- **Goods Table:** [Good.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/models/Good.ts#L79-L84) indexes `createdBy` (joining creator profile) and `category` (to support catalog filtering).

### 6.5 Database Reliability & Concurrency Controls

To keep our database safe, accurate, and protected against crash corruption or duplicate transactions, we use three core reliability techniques:

#### **1. Database Transactions (The "All-or-Nothing" Rule)**

* **What it is:** A safety feature that binds multiple updates together. Either every step succeeds, or everything is automatically undone (rolled back) as if nothing ever happened.
- **Analogy:** Imagine buying a drink from a vending machine. The machine must perform two steps: (1) take your coin, and (2) drop the soda. If the machine takes your coin but gets jammed before dropping the soda, a "rollback" automatically spits your coin back out. You never get charged without getting your drink.
- **How we use it:** When an auction ends, the server must deduct tokens from the winner's wallet **and** create a purchase receipt. If the server crashes halfway through, the database automatically undoes any partial changes so the user doesn't lose their tokens without a receipt.
- **Implementation:** Wrapped inside `sequelize.transaction()` (for example, in [AuctionResolutionFacade.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/facades/AuctionResolutionFacade.ts#L21)).

#### **2. Row Locking (The "One-at-a-Time" Queue)**

* **What it is:** A lock that blocks other requests from reading or changing a specific row in a table while a transaction is busy updating it.
- **Analogy:** Imagine a joint bank account with a balance of $10. Two people try to spend the last $10 at the exact same millisecond at different shops. Without locking, both transactions check the balance simultaneously, see $10, and approve both purchases (resulting in a negative balance of -$10). With row locking, the first transaction "locks" the balance row. The second transaction must wait in line until the first is finished, then it checks the balance (now $0) and is correctly rejected.
- **How we use it:** When resolving a winner, we place a lock on the user's wallet row. This prevents double-spending and makes sure that parallel requests cannot interfere with each other's calculations.
- **Implementation:** Configured using `{ lock: transaction.LOCK.UPDATE }` (seen in [AuctionResolutionFacade.ts](file:///c:/Users/user/Downloads/Programmazione%20Avanzata/Auction-management-backend-application/src/facades/AuctionResolutionFacade.ts#L25) when locking the auction and wallet rows).

#### **3. Referential Integrity (Safety Chains: CASCADE vs. RESTRICT)**

* **What it is:** Rules that connect tables to prevent orphaned records or accidental deletions of important history.
- **CASCADE (Delete Everything Linked):**
  - *Analogy:* If you throw away a keyring, all the keys hanging on it go into the trash too.
  - *How we use it:* If a User account is deleted, their associated Wallet is deleted automatically to prevent empty database rows.
- **RESTRICT (Block Accidental Deletes):**
  - *Analogy:* You cannot delete a house deed from the city hall records if the house has already been sold.
  - *How we use it:* Once a winning Receipt is generated for an auction, the system blocks (`RESTRICT`) anyone from deleting that auction or the item that was sold, protecting our financial audit logs.

---

## 🐳 7. Setup Project

we provide two ways to start the project first one locally  , second one is using docker

### 7.1 Run Development Version

To start the application locally in development mode (with active TypeScript hot-reloading), follow these steps:

#### Step 1: Install Dependencies

Run the package installer to get all node packages:

```bash
npm install
```

#### Step 2: Set Up Development Env File

Copy the environment template in the root directory:

```bash
cp .env.example .env
```

Ensure that `DB_HOST=localhost` and `NODE_ENV=development` are configured.

#### Step 3: Generate RSA JWT Keys

This application uses **RS256 (asymmetric RSA) signatures** to secure user sessions and verify user roles. You must generate your public and private keys locally before running the app.

- **Why is this step necessary?**  
  The server checks for the presence of these keys immediately at startup to initialize the JWT authentication middleware. Without these keys, the server cannot secure its endpoints or generate valid login tokens, which would result in errors or crashes when users try to log in.

1. Run the key generator script:

   ```bash
   node scripts/generateKeys.js
   ```

2. Copy the contents of the generated files `keys/private.pem` and `keys/public.pem` and paste them into your `.env` variables `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.

> [!WARNING]
> **Do not remove the PEM headers and footers!**  
> When pasting the keys, you must include the full file contents, including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` and `-----BEGIN PUBLIC KEY-----` / `-----END PUBLIC KEY-----` lines. If you remove these headers, the server will fail to start and throw a `Secret or private key must be an asymmetric key` error.
>
> Also, ensure that the entire key is pasted as a single line, with every newline replaced by `\n` (for example: `JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----"`).

#### Step 4: Start the PostgreSQL Container Only

If you are running the database via Docker but want to run the Express app locally, spin up only the Postgres service:

```bash
docker compose -f docker/docker-compose.yml up -d postgres
```

#### Step 5: Run Database Migrations and Seeding

Initialize the database tables and pre-populate the test data (such as creators, participants, goods, and wallets):

```bash
# Run migrations
npx sequelize-cli db:migrate

# Populate seed data
npx sequelize-cli db:seed:all
```

#### Step 6: Start the Development Server

Launch the server in hot-reload mode:

```bash
npm run dev
```

The server will start listening at `http://localhost:3000`. Any code changes inside `src/` will trigger an automatic restart.

---

### 7.2 Run Production Version (via Docker Compose)

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg" width="120" alt="Docker Logo">
</div>

The complete system (application and external PostgreSQL database) can be spun up using Compose.

#### Step 1: Set Up Environment Configuration Files (`.env`)

To configure both the Express application and the PostgreSQL database container, you must set up two separate environment files:

1. **Root `.env` (for the Express Application)**:
   - Copy the template in the root directory:

     ```bash
     cp .env.example .env
     ```

   - Open the `.env` file and verify the application port and database connection credentials.

2. **Docker `.env` (for the Postgres Database Container)**:
   - Copy the template inside the `docker/` folder:

     ```bash
     cp docker/.env.exemple docker/.env
     ```

   - Verify that the database setup credentials (`POSTGRES_USER` and `POSTGRES_PASSWORD`) match your root configuration (`DB_USER` and `DB_PASSWORD`).

### Step 2: Generate RSA JWT Keys

This application uses **RS256 (asymmetric RSA) signatures** to secure user sessions and verify user roles. You must generate your public and private keys locally before running the containers.

- **Why is this step necessary for Docker?**  
  The Docker container does **not** generate keys internally. Instead, Docker Compose reads the `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` variables from your host's root `.env` file and passes them to the container. If you skip this, the containerized server will boot with empty keys and fail to authenticate incoming API requests.

1. Run the key generator script:

   ```bash
   node scripts/generateKeys.js
   ```

2. Copy the contents of the generated files `keys/private.pem` and `keys/public.pem` and paste them into your root `.env` variables `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.

> [!WARNING]
> **Do not remove the PEM headers and footers!**  
> When pasting the keys, you must include the full file contents, including the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` and `-----BEGIN PUBLIC KEY-----` / `-----END PUBLIC KEY-----` lines. If you remove these headers, the server will fail to start and throw a `Secret or private key must be an asymmetric key` error.
>
> Also, ensure that the entire key is pasted as a single line, with every newline replaced by `\n` (for example: `JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----"`).

### Step 3: Run Services

Execute the compose build and up commands:

```bash
docker-compose -f docker/docker-compose.yml up --build
```

This boots Postgres, verifies its health status, and then launches the TypeScript app on port `3000`.

### Step 4: Run Database Migrations and Seeding inside the Containers

Once the Docker containers are successfully built and running, you need to initialize the database tables and apply the database seeding strategy:

```bash
# Run migrations inside the running app container
docker compose -f docker/docker-compose.yml exec app npx sequelize-cli db:migrate

# Populate seed data inside the running app container
docker compose -f docker/docker-compose.yml exec app npx sequelize-cli db:seed:all
```

This will pre-populate the Postgres DB container with the full administrative profile, catalog goods, participants with their wallet balances, and historic auctions/bids history.

---

## 🧪 8. Unit / Integration Testing using Jest

### 8.1 Core Concepts of Testing

- **What is Unit Testing?**
  Unit testing is the process of testing the smallest testable parts (units) of an application (such as individual functions, helpers, or Express middlewares) in complete isolation. We mock all external dependencies—like databases, filesystems, and token verification libraries—to make sure we are only testing the logic inside the function itself. This prevents external failures (like a database connection timeout) from breaking unit test runs.

- **What is Jest?**
  Jest is a modern, zero-configuration JavaScript and TypeScript testing framework developed by Facebook. It comes equipped with a test runner, assertion library (`expect`), mock utilities (`jest.mock` and `jest.fn`), and clean coverage reports, making it the industry standard for testing Node.js applications.

- **What do we do with Jest in this project?**
  We use Jest to automate the execution of unit tests for our key middleware layers (Authentication, Authorization, and Error Handling) and integration tests for checking API endpoints. This guarantees that any changes or refactoring to the codebase will not break existing business logic.

---

### 8.2 Isolated Mocking Strategy (Why Seeding is Not Needed for Tests)

In this application, **Unit and Integration testing using Jest does NOT require database seeding to function correctly**.

This is because the Jest test suite operates under a strict isolation design:

- **Middlewares Unit Tests**: Middleware tests (for JWT authentication, Role-Based Access Control, and global error handling) are tested by feeding mock request and response objects (`req`/`res`) into the functions. They never invoke database models.
- **Routes Integration Tests**: Route integration checks (which verify API endpoint behaviors using `supertest`) **mock all Sequelize model methods completely** (e.g. `User.findOne`, `User.create`, `Wallet.create`). This isolates the HTTP controller layer from local PostgreSQL database states.

Consequently, you can execute the entire test suite (`npm run test`) successfully even if the database container is stopped. Database seeding is only needed when testing the actual physical database writes, such as running the E2E verification script (`npx ts-node scripts/testApis.ts`).

---

### 8.3 Middlewares Under Test

We write comprehensive unit tests to cover the three main middleware layers of our Express application:

#### 1. Authentication Middleware (`authenticateJWT` in `src/middleware/auth.ts`)

This middleware intercepts incoming requests to secure routes, parses the `Authorization` header, and verifies the JWT.

- **Tested Scenarios**:
  - Verify that a valid token is decoded successfully, and user payload info (`id` and `role`) is attached to `req.user`.
  - Verify that requests with missing `Authorization` headers are rejected with an `UnauthorizedError`.
  - Verify that requests with malformed tokens (e.g. missing `Bearer` prefix) are rejected with an `UnauthorizedError`.
  - Verify that expired or invalid signatures trigger token verification failures and are rejected with an `UnauthorizedError`.

#### 2. Authorization Middleware (`authorizeRole` in `src/middleware/auth.ts`)

This middleware checks whether the logged-in user possesses the required privileges to access specific endpoints.

- **Tested Scenarios**:
  - Verify that users with authorized roles (e.g. `admin` or `bid-creator`) are successfully allowed to proceed.
  - Verify that users with unauthorized roles (e.g. `bid-participant` attempting to access admin statistics) are rejected with a `ForbiddenError` (403 status code).
  - Verify that requests without a user profile attached (`req.user` is undefined) are rejected with an `UnauthorizedError` (401 status code).

#### 3. Global Error Handler Middleware (`errorHandler` in `src/middleware/errorHandler.ts`)

This middleware acts as a centralized safety net for the entire application, capturing all errors thrown inside controllers and formatting them into standard JSON responses.

- **How It Works**:
  Instead of writing manual `try/catch` blocks inside every route controller, we wrap controllers in our `asyncHandler` helper. If an error occurs, it is automatically passed to the next middleware by calling `next(err)`. The `errorHandler` captures it at the end of the Express middleware chain.

- **Classification of Errors**:
  - **Operational Errors (`AppError` subclasses)**:
    These are expected runtime errors that occur during normal application usage. The middleware checks if the error is an instance of `AppError` (or its child classes like `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`). If it is, the middleware extracts the specific `statusCode` and the developer-defined `message` and sends them back to the client.
  - **Validation Errors (`ValidationError`)**:
    When a Zod validation fails (e.g., input request payload has wrong data formats or missing fields), a `ValidationError` is thrown. The middleware specifically checks for this instance and appends a detailed `errors` array, showing exactly which fields (like `email` or `password`) failed and why.
  - **Unhandled / Programming Errors**:
    If a system crash or coding bug occurs (like a database connection failure or undefined variable reference), it will not be an instance of `AppError`. The middleware handles this by:
    1. Logging the full technical error stack trace to the console (`console.error('Unhandled error:', err)`) so that developers can debug it.
    2. Returning a generic `500 Internal Server Error` message to the client. This hides sensitive server internals, table names, and system paths from potential attackers.

- **Consistent Response Format**:
  The middleware delegates serialization to the `formatError` function inside `src/views/errorView.ts` to ensure that all error responses throughout the application use the exact same envelope structure:

  ```json
  {
    "success": false,
    "status": 422,
    "message": "Validation failed",
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
  ```

- **Tested Scenarios inside Jest**:
  - Verify that custom `AppError` instances return their specific HTTP status code (e.g., `400` or `404`) and formatted messages.
  - Verify that `ValidationError` instances format and output structured validation details with status `422`.
  - Verify that unhandled system errors output a status `500`, return a generic message, and write details to the console log.

---

### 8.4 Execution and Test Results

To execute the Jest testing suite locally, run:

```bash
npm run test
```

#### Terminal Console Output

```text
> auction-management-backend-application@1.0.0 test
> jest

PASS tests/middleware/errorHandler.test.ts
PASS tests/middleware/auth.test.ts
PASS tests/integration/routes.test.ts

Test Suites: 3 passed, 3 total
Tests:       13 passed, 13 total
Snapshots:   0 total
Time:        5.424 s, estimated 6 s
Ran all test suites.
```

#### Command Prompt Execution Screenshot

<div align="center">
  <img src="./assets/jest_test_results.png" width="650" alt="Jest Test Results Console Output">
</div>

---

## 📬 9. API Testing Examples using Postman

You can test these routes by setting up your request headers with `Authorization: Bearer <TOKEN>`.

### **0. Database Seeding Strategy**

To initialize the Postgres database with realistic and substantial test data before testing APIs, the Sequelize setup includes a seed configuration generating:

- **Administrative Profile**: An admin user equipped with keys to execute wallet recharges.
- **Creators (bid-creators)**: Profiles pre-loaded with physical catalog goods.
- **Participants (bid-participants)**: Multiple bidding users, each linked to a pre-populated `Wallet` containing a realistic initial balance (e.g. `10,000.00` tokens).
- **Active/Closed Auctions & Historic Bids**: To show realistic chart history, pre-seeding includes completed auctions, generated receipts, and current ongoing bidding increments.

**How to Run the Seeds**:
When cloning this project, developers must run the seeding commands as part of the initial database setup. The commands differ depending on whether you run in development mode locally or inside Docker Compose:

- **Local Development**: See [Step 4 of local development setup](#step-4-run-database-migrations-and-seeding) which uses `npx sequelize-cli db:seed:all`.
- **Production Docker Compose**: See [Step 4 of production setup](#step-4-run-database-migrations-and-seeding-inside-the-containers) which executes the seed command inside the running app container.

### 0.1 Setting up Graphical User Interfaces (GUIs) to Interact with Database

To make database exploration easier, we recommend using a GUI tool such as **DBeaver**.

Using a GUI helps you view the database in a clear and structured way (tables, rows, relationships, and query results) instead of relying only on terminal commands.

- **Recommended tool:** DBeaver  
- **Installation link:** <https://dbeaver.io/>

#### How to connect DBeaver to our PostgreSQL database

1. Open **DBeaver** and click **New Database Connection**.
2. Select **PostgreSQL** from the list of database engines.
3. Fill in the connection settings using the same values from your project `.env` (or `docker/.env`):
   - **Host**: `localhost` (or your DB host)
   - **Port**: `5432` (or your configured DB port)
   - **Database**: your database name (e.g., `auction_db`)
   - **Username**: your `DB_USER`
   - **Password**: your `DB_PASSWORD`
4. Click **Test Connection** to verify access.
5. Click **Finish** to save and open the connection.
6. Expand the connection tree to browse:
   - `Users`
   - `Wallets`
   - `Goods`
   - `Auctions`
   - `Bids`
   - `Receipts`

<div align="center">
  <img src="./assets/Dbeaver_screenshot.png" width="800" alt="DBeaver Database Explorer">
</div>

> [!TIP]
> If you are running Docker Compose, make sure the PostgreSQL container is up before connecting:
>
> ```bash
> docker compose -f docker/docker-compose.yml up -d postgres
> ```
>
>
---

### 0.2 What is Postman?

<div align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postman/postman-original.svg" width="120" alt="Postman Logo">
</div>

**Postman** is a popular API client tool used to test and interact with backend endpoints without building a frontend interface first.

It allows developers to:

- Send HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Add headers (such as `Authorization: Bearer <TOKEN>`)
- Send JSON request bodies
- Inspect response status codes, headers, and payloads
- Organize requests into collections for repeatable testing

In this project, Postman is useful for validating authentication flows, role-based access control, auction lifecycle routes, bidding operations, wallet actions, and receipt generation endpoints.

- **Official website:** <https://www.postman.com/>
- **Desktop download:** <https://www.postman.com/downloads/>

___

#### Postman Setup

✅ How to Create a Postman Environment with Reusable Variables?

Using environment variables in Postman makes your API testing faster, cleaner, and less error-prone.  
Instead of rewriting URLs, tokens, or UUIDs in every request, you define them once and reuse them everywhere.

### Step 1: Create a New Environment

1. Open Postman.
2. In the left sidebar, click **Environments**.
3. Click **Create Environment**.
4. Name it: `Auction Backend - Local`.

### Step 2: Add Reusable Variables

Add these variables in the environment table:

| Variable Name | Initial Value | Current Value | Purpose |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` | Root API host |
| `apiPrefix` | `/api/v1` | `/api/v1` | Shared API version prefix |
| `token` | *(leave empty)* | *(paste JWT after login)* | Bearer token for protected routes |
| `creatorToken` | *(optional)* | *(JWT of bid-creator)* | For creator-only routes |
| `participantToken` | *(optional)* | *(JWT of bid-participant)* | For bidding routes |
| `adminToken` | *(optional)* | *(JWT of admin)* | For admin-only routes |
| `auctionUuid` | *(dynamic)* | *(set after creating/scheduling auction)* | Reuse auction target |
| `goodUuid` | *(dynamic)* | *(set after creating good)* | Reuse good target |
| `userUuid` | *(dynamic)* | *(set after registration)* | Reuse user target |

> [!NOTE]
>
> - **Initial Value** is shared/exported.
> - **Current Value** is local/private on your machine (best place for secrets like tokens).

> [!TIP]
> **How to get the JWT tokens for these variables?**  
> You can choose to either **use the pre-seeded user profiles** or **create your own custom profiles**:
>
> - **Option A: Use the Pre-seeded User Profiles (Fastest)**  
>   Send a `POST {{baseUrl}}{{apiPrefix}}/auth/login` request using the following credentials:
>   1. **Admin (`adminToken`)**:
>      - Email: `admin@auction.com`
>      - Password: `Admin@123!`
>   2. **Bid-Creator (`creatorToken`)**:
>      - Email: `creator1@auction.com`
>      - Password: `Creator@123!`
>   3. **Bid-Participant (`participantToken`)**:
>      - Email: `participant1@auction.com`
>      - Password: `Participant@123!`
>
> - **Option B: Create Your Own Custom User Profiles**  
>   If you want to register and use new users instead:
>   1. Send a `POST {{baseUrl}}{{apiPrefix}}/auth/register` request (see the *User Registration* example below) with your desired `username`, `email`, `password`, and target `role` (`'admin'`, `'bid-creator'`, or `'bid-participant'`).
>   2. Send a `POST {{baseUrl}}{{apiPrefix}}/auth/login` request with the email and password you just registered.
>
> In both cases, copy the `token` string returned in the JSON response (`data.token`) and paste it into the **Current Value** column of your Postman environment table.

### Step 3: Select the Environment

From the top-right environment dropdown in Postman, select:
`Auction Backend - Local`

### Step 4: Use Variables in Request URLs

Instead of hardcoding full URLs, write:

```http
{{baseUrl}}{{apiPrefix}}/auth/register
{{baseUrl}}{{apiPrefix}}/auth/login
{{baseUrl}}{{apiPrefix}}/auctions
{{baseUrl}}{{apiPrefix}}/auctions/{{auctionUuid}}/bids
{{baseUrl}}{{apiPrefix}}/wallet/balance
```

### Step 5: Add Authorization Header Once (Collection Level)

1. Create or open your Postman collection (e.g., `Auction Backend API`).
2. Go to **Authorization** tab.
3. Set **Type** = `Bearer Token`.
4. In Token field, use: `{{token}}`.
5. Save collection.

Now all requests inside the collection inherit this automatically.

### Step 6: Recommended Folder Structure in Postman Collection

Organize requests like this:

To keep API testing organized and maintainable, create a Postman Collection named:

**`Auction Backend API`**

Inside it, create the following folders and requests:

---

#### 1) `Auth`

Handles account creation and JWT token retrieval for different roles.

- **Register**
  - `POST {{baseUrl}}{{apiPrefix}}/auth/register`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "username": "hassen",            // String (Min 3, Max 50, required)
      "email": "hassen@example.com",    // String (Valid email format, required)
      "password": "SecurePassword123", // String (Min 8, must contain 1 uppercase letter and 1 number, required)
      "role": "bid-participant"        // Enum: admin, bid-creator, bid-participant (optional, default: bid-participant)
    }
    ```

* **Login (Creator)**
  - `POST {{baseUrl}}{{apiPrefix}}/auth/login`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "email": "creator@example.com",   // String (Valid email format, required)
      "password": "SecurePassword123"  // String (Required)
    }
    ```

* **Login (Participant)**
  - `POST {{baseUrl}}{{apiPrefix}}/auth/login`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "email": "participant@example.com", // String (Valid email format, required)
      "password": "SecurePassword123"    // String (Required)
    }
    ```

* **Login (Admin)**
  - `POST {{baseUrl}}{{apiPrefix}}/auth/login`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "email": "admin@example.com",      // String (Valid email format, required)
      "password": "SecurePassword123"    // String (Required)
    }
    ```

---

#### 2) `Goods`

Covers catalog lot creation and retrieval.

- **Create a new good** *(restricted to `bid-creator` role)*
  - `POST {{baseUrl}}{{apiPrefix}}/goods`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "name": "Vintage Gold Watch",    // String (Min 2, Max 200, required)
      "description": "1960s mechanical chronograph in mint condition.", // String (Min 10, required)
      "category": "Collectibles",      // String (Min 2, Max 100, required)
      "basePrice": 150.00              // Positive number (> 0, required)
    }
    ```

* **Get Goods** *(Public)*
  - `GET {{baseUrl}}{{apiPrefix}}/goods`
- **Get Goods by Category** *(Public)*
  - `GET {{baseUrl}}{{apiPrefix}}/goods?category=Collectibles`

---

#### 3) `Auctions`

Covers auction lifecycle creation and state transitions.

- **Create a new auction** *(restricted to `bid-creator` role)*
  - `POST {{baseUrl}}{{apiPrefix}}/auctions`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "goodUuid": "e7b0c95d-7a54-47a8-9d51-40efb8bdfb04", // String (Valid Good UUID, required)
      "type": "ENGLISH",                                 // Enum: ENGLISH, SEALED_BID (required)
      "startingPrice": 180.00,                           // Positive number (> 0, required)
      "minimumIncrement": 10.00,                         // Positive number (> 0, optional, default: 1)
      "startAt": "2026-07-20T12:00:00.000Z",             // ISO Datetime string (required)
      "endAt": "2026-07-22T12:00:00.000Z"                // ISO Datetime string (must be after startAt, required)
    }
    ```

* **Get Auctions** *(Public)*
  - `GET {{baseUrl}}{{apiPrefix}}/auctions`
- **Get Running Auctions** *(Public)*
  - `GET {{baseUrl}}{{apiPrefix}}/auctions?state=RUNNING`
- **Transition Auction State** *(restricted to owner `bid-creator` or `admin`)*
  - `PATCH {{baseUrl}}{{apiPrefix}}/auctions/{{auctionUuid}}/state`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "action": "schedule" // Enum: schedule, start, close, cancel (required)
    }
    ```

---

#### 4) `Bids`

Covers bid placement and bid history visibility rules.

- **Place a bid** *(restricted to `bid-participant` role)*
  - `POST {{baseUrl}}{{apiPrefix}}/auctions/{{auctionUuid}}/bids`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "amount": 250.00 // Positive number (> 0, required; must exceed current price + min increment for English or basePrice for Sealed)
    }
    ```

* **Get Bids** *(Public)*
  - `GET {{baseUrl}}{{apiPrefix}}/auctions/{{auctionUuid}}/bids`
  - *(Note: Sealed-bid amounts and bidders are masked until closed).*

---

#### 5) `Wallet`

Covers participant balance operations.

- **Get Wallet Balance** *(restricted to `bid-participant` role)*
  - `GET {{baseUrl}}{{apiPrefix}}/wallet/balance`

---

#### 6) `Admin`

Covers admin-only platform operations.

- **Get Wallet Info** *(restricted to `admin` role)*
  - `GET {{baseUrl}}{{apiPrefix}}/admin/wallet/info`

- **Recharge Wallet** *(restricted to `admin` role)*
  - `POST {{baseUrl}}{{apiPrefix}}/admin/wallet/recharge`
  - **Request Body Schema & Constraints**:

    ```json
    {
      "userUuid": "e8a1f49b-b2d8-4d2c-8153-f725a3d76e4c", // String (Valid User UUID, required)
      "amount": 500.00                                   // Positive number (> 0, required)
    }
    ```

* **Get Statistics** *(restricted to `admin` role)*
  - `GET {{baseUrl}}{{apiPrefix}}/admin/statistics`
  - *(Supports optional date filtering using query params: `?startDate=ISO&endDate=ISO`)*

---

#### 7) `Users`

Covers authenticated user history and spending.

- **Get My Auctions** *(restricted to `bid-participant` or `admin`)*
  - `GET {{baseUrl}}{{apiPrefix}}/users/me/auctions`
- **Get Won Auctions Only** *(restricted to `bid-participant` or `admin`)*
  - `GET {{baseUrl}}{{apiPrefix}}/users/me/auctions?filter=won`
- **Get My Spending** *(restricted to `bid-participant` or `admin`)*
  - `GET {{baseUrl}}{{apiPrefix}}/users/me/spending`
  - *(Supports optional date filtering using query params: `?startDate=ISO&endDate=ISO`)*

---

#### 8) `Receipts`

Covers PDF receipt download for awarded auctions.

- **Download Receipt** *(restricted to the winning user or `admin`)*
  - `GET {{baseUrl}}{{apiPrefix}}/auctions/{{auctionUuid}}/receipt`

> [!TIP]
> In Postman, use **“Send and Download”** for this endpoint to save the PDF file locally.

---

#### 9) `WebSocket (Docs/Examples)`

This folder documents and stores examples for real-time events (non-HTTP).  
You can include:

- Connection URL example:
  - `ws://localhost:3000/api/v1/ws?token=<YOUR_JWT_TOKEN>`
- Sample `PRICE_UPDATE` event payload
- Sample `AWARD_COMPLETED` event payload
- Notes about which auction state triggers each event

---

### Step 10: Common Troubleshooting

- **401 Unauthorized**: token missing/expired → login again.
- **403 Forbidden**: wrong role token for that route.
- **404 Not Found**: invalid `auctionUuid`/`goodUuid`.
- **ECONNREFUSED**: backend not running at `{{baseUrl}}`.
- **Validation errors (422/400)**: check JSON body fields and types.

> [!WARNING]
> **API Client Request Configuration Details:**
>
> 1. **Active Environment:** Ensure you have selected the appropriate environment (e.g. **`Auction Backend - Local`**) in your API client (Bruno/Postman) instead of **`No environment`**. Otherwise, variables like `{{baseUrl}}` and `{{apiPrefix}}` will not resolve, resulting in a `getaddrinfo ENOTFOUND {{baseUrl}}{{apiPrefix}}` error.
> 2. **Request Body vs. Query Params:** For routes like `POST /auth/login` and `POST /auth/register`, credentials MUST be sent in the **Request Body** as a JSON object, not in the **Query Params**. Sending them as Query Params will result in a validation failure: `"Invalid input: expected object, received undefined"`.
> 3. **Casing constraints:** Make sure fields in your JSON body match the schemas exactly (e.g., use lowercase `email` and `password`, not `Email` and `Password`).

---

### Example Quick Flow (Minimal)

1. Register participant.
2. Login participant → auto-save `t oken`.
3. Call `GET {{baseUrl}}{{apiPrefix}}/wallet/balance`.
4. Login creator → save `creatorToken`.
5. Create good + auction → save `goodUuid`, `auctionUuid`.
6. Login participant → set `token={{participantToken}}`.
7. Place bid on `{{auctionUuid}}`.

> [!TIP]
> You can import the testing configuration files directly into your Postman client to run this entire workflow:
> * **Postman Collection File**: [Auction Backend API.postman_collection.json](./assets/Auction%20Backend%20API.postman_collection.json)
> * **Environment Configuration File**: [Auction Backend - Local.postman_environment.json](./assets/Auction%20Backend%20-%20Local.postman_environment.json)

___
**Now let's see some exmaples.**

### 1. User Registration

`POST /api/v1/auth/register`

<div align="center">
  <img src="./assets/Postman_Register_User.png" width="800" alt="Postman Register User">
</div>

### 2. User Login

`POST /api/v1/auth/login`

<div align="center">
  <img src="./assets/Postman_Login_User.png" width="800" alt="Postman Login_User">
</div>

### 3. Watching Goods (Public)

- **View All Goods**:
  `GET /api/v1/goods`

  <div align="center">
    <img src="./assets/Postman_GET_goods_public.png" width="800" alt="Postman GET Goods Public">
  </div>

- **View Goods by Category**:
  `GET /api/v1/goods?category=technology`

  <div align="center">
    <img src="./assets/Postman_get_goods_by_category.png" width="800" alt="Postman GET Goods by Category">
  </div>

### 4. Creating a Good (Creator Only)

`POST /api/v1/goods`

We tested this endpoint under different authentication states to verify the RBAC logic:

- **Authorized Request (using `bid-creator` role)**:
  We sent the request with a valid `bid-creator` token. The system successfully created the catalog item and returned a `201 Created` status with the good details:

  <div align="center">
    <img src="./assets/Postman_create_a_good.png" width="800" alt="Postman Create Good Request">
  </div>

  <div align="center">
    <img src="./assets/Postman_create_good_bid_creator_user_allowed.png" width="800" alt="Postman Create Good Success Response">
  </div>

- **Unauthorized Request (using `bid-participant` role)**:
  When attempting to send the same request using a participant's JWT token, the server correctly rejected the request with a `403 Forbidden` response:

  <div align="center">
    <img src="./assets/Postman_exemple_of_unothrized_bit_participant_role.png" width="800" alt="Postman Create Good Unauthorized Participant Response">
  </div>

---

### Scenario A: English Auction Lifecycle Scenario

### 5. Creating an Auction (Creator Only)

`POST /api/v1/auctions`

We submit a request to create a new English auction for the previously created good. The start date and end date are validated by the Zod schema:

<div align="center">
  <img src="./assets/Postman_create_an_auction.png" width="800" alt="Postman Create Auction Request">
</div>

### 6. Scheduling the Auction (Creator/Admin Only)

`PATCH /api/v1/auctions/:uuid/state`

With the auction successfully created in the `DRAFT` state, the catalog owner schedules it by sending `action: "schedule"` in the request body:

<div align="center">
  <img src="./assets/Postman_schedule_an_auction.png" width="800" alt="Postman Schedule Auction Request">
</div>

### 7. Login as Participant 5

`POST /api/v1/auth/login`

To prepare for bidding, we authenticate as `participant5@auction.com` (using password `Participant@123!`). The server returns a JWT token which we save to our environment to authenticate participant-level operations:

<div align="center">
  <img src="./assets/Postman_login_as_participant_5.png" width="800" alt="Postman Login as Participant 5">
</div>

### 8. Retrieving All Auctions

`GET /api/v1/auctions`

We retrieve the list of all system auctions to confirm that the newly scheduled auction is listed correctly:

<div align="center">
  <img src="./assets/Postman_get_all_auctions.png" width="800" alt="Postman Get All Auctions Response">
</div>

### 9. Retrieving Running Auctions

`GET /api/v1/auctions?status=RUNNING`

By filtering with the `status` query parameter, we can list only active, running auctions ready for bidding:

<div align="center">
  <img src="./assets/Postman_get_all_runing_auctions.png" width="800" alt="Postman Get Running Auctions Response">
</div>

### 10. Placing a Bid on the English Auction

`POST /api/v1/auctions/:uuid/bids`

Logged in as `participant5`, we place a valid bid on the active English auction. The system verifies wallet token availability before accepting the bid:

<div align="center">
  <img src="./assets/Postamn_place_Englsih_bid.png" width="800" alt="Postman Place English Bid Request">
</div>

### 11. Retrieving Bids on the English Auction

`GET /api/v1/auctions/:uuid/bids`

Since this is an English auction, the bid history is public and we can retrieve all placed bids:

<div align="center">
  <img src="./assets/Postam_Get_all_bids_English.png" width="800" alt="Postman Get All Bids English Response">
</div>

### 12. The duration of this auction has finished

After the auction duration ends, the auction state becomes `CLOSED`. The system then determines the winner (the participant with the highest bid) and subtracts the winning amount from their balance.

<div align="center">
  <img src="./assets/Postman_the_auction_is_finsihed.png" width="800" alt="Here the Auction Ends">
</div>

### 13. Verifying Participant Balance (Tokens Deducted)

`GET /api/v1/wallet/balance`

Retrieving the participant's balance shows that the winning bid amount has been successfully deducted from the wallet:

<div align="center">
  <img src="./assets/Postman_get_balence_after_the_auction_finish.png" width="800" alt="Postman Wallet Balance After Close">
</div>

### 14. Downloading the PDF Receipt

`GET /api/v1/auctions/:uuid/receipt`

The winning bidder or any system admin can download the receipt for a won closed auction.

* **Headers**:
  * `Authorization: Bearer <TOKEN>` (must be the winning bidder's token or an admin's token)
* **Response Details**:
  * **Status**: `200 OK`
  * **Headers**:
    * `Content-Type: application/pdf`
    * `Content-Disposition: attachment; filename=receipt-<uuid>.pdf`
  * **Body**: Binary PDF document stream containing invoice layout, transaction ID, paid tokens count, and timestamp.
  * **Storage Behavior**: **Dynamically generated in-memory on-the-fly** as a PDFKit stream and piped to the response (never saved on the server's hard disk to prevent storage leak).

The winning bidder downloads the dynamically generated PDF receipt showing the transaction metadata:

<div align="center">
  <img src="./assets/Postman_get_my_receipt.png" width="800" alt="Postman Download PDF Receipt">
</div>

### 15. User Bidding History & Expenditure Analytics

We can query the participant's personal activity history using different filters:

- **Retrieve All My Auctions**:
  `GET /api/v1/users/me/auctions`

  <div align="center">
    <img src="./assets/Postman_get_all_my_auctions.png" width="800" alt="Postman Get My Auctions">
  </div>

- **Filter Won Auctions Only**:
  `GET /api/v1/users/me/auctions?filter=won`

  <div align="center">
    <img src="./assets/Postamn_get_all_winned_auctions.png" width="800" alt="Postman Get Won Auctions">
  </div>

- **Retrieve All My Spendings**:
  `GET /api/v1/users/me/spending`

  <div align="center">
    <img src="./assets/Postamn_get_all_my_spendings.png" width="800" alt="Postman Get Total Spendings">
  </div>

- **Query Spending in a Specific Timeframe**:
  `GET /api/v1/users/me/spending?startDate=2026-07-18&endDate=2026-07-20`

  <div align="center">
    <img src="./assets/Postman_get_all_my_spending_in_specific_duration.png" width="800" alt="Postman Get Spendings in Timeframe">
  </div>

---

### Scenario B: First-Price Sealed-Bid Scenario (Information Hiding Verification)

This scenario demonstrates the creation, start, and bidding workflow for a Sealed-Bid auction, illustrating the strict information-hiding requirements where bid amounts and bidder identities are hidden (`null`) from other participants while the auction is running.

#### 1. Creating a Sealed-Bid Auction (Creator Only)
Logged in as the `bid-creator`, we schedule a new First-Price Sealed-Bid auction:

<div align="center">
  <img src="./assets/Postam_create_sealed_bid_auction.png" width="800" alt="Postman Create Sealed-Bid Auction Request">
</div>

#### 2. Starting the Sealed-Bid Auction (Creator/Admin Only)
We transition the state of the Sealed-Bid auction to `RUNNING` using the state PATCH endpoint:

<div align="center">
  <img src="./assets/Postamn_start_sealed_bid_auction.png" width="800" alt="Postman Start Sealed-Bid Auction Request">
</div>

#### 3. Log In as Participant 5
We authenticate with participant credentials to obtain an authorization token:

<div align="center">
  <img src="./assets/postman_log_in_as_participant_5.png" width="800" alt="Postman Login Participant 5">
</div>

#### 4. Checking the Running Auction List
Participant 5 queries active running auctions and sees the newly started Sealed-Bid auction listed:

<div align="center">
  <img src="./assets/Postamn_the_sealed_bid_is_started.png" width="800" alt="Postman Running Auctions List">
</div>

#### 5. Placing a Sealed Bid (Participant 5)
Participant 5 places a blind bid of **`1200`** tokens. Under Sealed-Bid rules, they do not know what others are bidding:

<div align="center">
  <img src="./assets/postman_make_a_bid.png" width="800" alt="Postman Place Sealed Bid Request">
</div>

#### 6. Log In as Participant 4
Another participant (`participant4`) logs in to participate in the same auction:

<div align="center">
  <img src="./assets/Postman_Log_in_as_participant_4.png" width="800" alt="Postman Login Participant 4">
</div>

#### 7. Verifying Information Hiding (Masking as `null`)
To verify the system's privacy constraints, `participant4` calls the bid history endpoint. As required, the system hides all previous bid amounts and bidder identifiers by returning them as **`null`**, ensuring absolute blind-bidding integrity while the auction is active:

<div align="center">
  <img src="./assets/postman_get_bids_new_for_participant_4.png" width="800" alt="Postman Sealed Bids Masked Response">
</div>

---

### Scenario C: Admin Platform Operations Scenario

This scenario demonstrates the administrative control panel features available to the system `admin` user, covering general wallet auditing, credit recharging, and aggregated platform performance statistics.

#### 1. Retrieval of All Wallet Balances
Logged in as the system `admin`, we call the general balance audit endpoint (`GET /api/v1/admin/wallet/info`) to fetch details (UUID, username, and token balances) for all system users:

<div align="center">
  <img src="./assets/Postamn_admin_get_info_balences.png" width="800" alt="Postman Admin Get Wallet Info Balances">
</div>

#### 2. Recharging a Participant's Wallet
The system `admin` credits a participant's wallet with extra bidding tokens (`POST /api/v1/admin/wallet/recharge`), verifying credit limits:

<div align="center">
  <img src="./assets/Postman_recharge_admin.png" width="800" alt="Postman Admin Recharge Wallet">
</div>

#### 3. Fetching Aggregated Platform Statistics
The system `admin` queries statistics and general metrics (`GET /api/v1/admin/statistics`) to audit general bidding counts, total transactions, and historical metrics:

<div align="center">
  <img src="./assets/Postamn_admin_stat.png" width="800" alt="Postman Admin Platform Statistics">
</div>

---

## 🔌 10. Example of Using the WebSocket Channel

Clients listen to broadcasts on the WebSocket channel using JSON payloads , we will se two Incoming Events exeemples ,  PRICE_UPDATE (When a participant bids on an English Auction) and  AWARD_COMPLETED (When an auction is closed and resolved)
to achieve that we did 



#### Step 1: Login to Obtain Authorization Token
First, log in as a user (for example, using a participant account) to retrieve the JWT access token from the response:

<div align="center">
  <img src="./assets/Postman_websocket_first_step_login.png" width="800" alt="Postman WebSocket First Step Login">
</div>

#### Step 2: Create and Configure the WebSocket Connection URL
Open a new **WebSocket tab** in Postman and input the connection URL, passing your JWT token as a query parameter (`?token=...`):

<div align="center">
  <img src="./assets/Postman_websocket_second_step_Configure the Connection URL.png" width="800" alt="Postman WebSocket Second Step Configure Connection URL">
</div>

*Click the **Connect** button to establish the persistent duplex connection.*

#### Step 3: Login as Bid Creator
In a separate HTTP request tab, log in as a `bid-creator` so you have the required credentials to create and start a new auction:

<div align="center">
  <img src="./assets/Postman_websocket_third_step_login_as_bid_creator.png" width="800" alt="Postman WebSocket Third Step Login as Bid Creator">
</div>

#### Step 4: Create a New Auction / Good
Logged in as the creator, create a new auction linked to a lot in the catalog. The auction is initialized in the `DRAFT` state:

<div align="center">
  <img src="./assets/Postman_websocket_fourth_step_create_a_bid.png" width="800" alt="Postman WebSocket Fourth Step Create Auction">
</div>

#### Step 5: Start the Auction
Schedule and start the auction. Once its state changes to `RUNNING`, the WebSocket channel is ready to broadcast real-time bid updates to all connected listeners:

<div align="center">
  <img src="./assets/Postman_websocket_fifth_step_start_an_auction.png" width="800" alt="Postman WebSocket Fifth Step Start Auction">
</div>

#### Step 6: Login as Bidding Participant
Now, log in as a participant user who will place the bid on the active auction:

<div align="center">
  <img src="./assets/Postman_websocket_sixth_step_login_asçparticipant.png" width="800" alt="Postman WebSocket Sixth Step Login as Participant">
</div>

#### Step 7: Place a Bid on the Auction
Using the participant's authorization header, submit a new bid on the active running auction:

<div align="center">
  <img src="./assets/Postaman_websocket_seventh_step_place_a_bid.png" width="800" alt="Postman WebSocket Seventh Step Place Bid">
</div>

#### Step 8: Observe the Real-Time WebSocket Update (PRICE_UPDATE)
Switch back to your active Postman WebSocket tab. You will see that the server has instantly broadcasted a `PRICE_UPDATE` event with the new highest bid to all connected clients:

<div align="center">
  <img src="./assets/Postman_websocket_eghtith_step_websocket_update.png" width="800" alt="Postman WebSocket Eighth Step Real-Time Update">
</div>

#### Step 9: Observe the Real-Time WebSocket Closure (Award Completed)
When the auction is resolved and closed, the WebSocket channel instantly broadcasts an `AWARD_COMPLETED` event containing the final resolved winner details and transaction summary to all active clients:

<div align="center">
  <img src="./assets/Postman_websocket_nighth_award_completed.png" width="800" alt="Postman WebSocket Ninth Step Award Completed">
</div>

---
