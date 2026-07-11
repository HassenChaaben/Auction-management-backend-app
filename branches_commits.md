# Project Branches and Commits Workflow

This document outlines the branches and commits for the Catalog of Goods and Auction Management System backend. 
As per the workflow: **each new branch is created from `main`** (which contains the previously merged work), and after the commits are made, it is **merged back into `main`**.

## Phase 1: Infrastructure & DB Setup

### Branch: `feature/01-docker-db`
- **Created from:** `main`
- **Commits:**
  1. `chore: add docker/.env with postgres credentials`
  2. `chore: create docker-compose.yml for postgres service with healthchecks and volumes`
- **Action:** Merge `feature/01-docker-db` into `main`

### Branch: `feature/02-project-init`
- **Created from:** `main`
- **Commits:**
  1. `feat: initialize package.json and install typescript dependencies`
  2. `feat: configure tsconfig.json for ES2022 target`
  3. `feat: setup basic Jest configuration for testing`
- **Action:** Merge `feature/02-project-init` into `main`

### Branch: `feature/03-security-keys`
- **Created from:** `main`
- **Commits:**
  1. `feat: generate RSA RS256 private and public keys for JWT`
  2. `feat: create .env.example and setup dotenv loading`
  3. `chore: configure .gitignore to exclude .env and keys`
- **Action:** Merge `feature/03-security-keys` into `main`

## Phase 2: MVC Structure - Model Layer

### Branch: `feature/04-db-singleton`
- **Created from:** `main`
- **Commits:**
  1. `feat: implement database singleton pattern for Sequelize in src/config/database.ts`
- **Action:** Merge `feature/04-db-singleton` into `main`

### Branch: `feature/05-database-models`
- **Created from:** `main`
- **Commits:**
  1. `feat: define internal bigint keys and public uuid v4 for User and Wallet models`
  2. `feat: define Good and Auction models with state/type ENUMs and check constraints`
  3. `feat: define Bid and Receipt models with referential integrity rules`
  4. `feat: configure Sequelize associations (1-to-1, 1-to-Many) between models`
  5. `feat: create explicit database indexes on UUIDs and foreign keys`
  6. `chore: generate database migrations for all tables`
- **Action:** Merge `feature/05-database-models` into `main`

### Branch: `feature/06-database-seeds`
- **Created from:** `main`
- **Commits:**
  1. `feat: build seeder for admin profile and bid-creators`
  2. `feat: build seeder for bid-participants with populated Wallets (10,000 tokens)`
  3. `feat: seed historical active/closed auctions and bids for analytics testing`
- **Action:** Merge `feature/06-database-seeds` into `main`

## Phase 3: MVC Structure - Routing Gateway & Server Shell

### Branch: `feature/07-server-shell`
- **Created from:** `main`
- **Commits:**
  1. `feat: setup base Express router initialization in src/app.ts`
  2. `feat: implement centralized async errorHandler middleware mapping AppError classes`
  3. `feat: add errorView.ts to serialize clean JSON error responses`
- **Action:** Merge `feature/07-server-shell` into `main`

### Branch: `feature/08-auth-middleware`
- **Created from:** `main`
- **Commits:**
  1. `feat: implement authenticateJWT middleware utilizing Bearer Token headers (ensure JWT contains ONLY user metadata)`
  2. `feat: implement authorizeRole proxy middleware for RBAC checks`
  3. `feat: add validateRequest middleware using Zod/Joi schemas`
- **Action:** Merge `feature/08-auth-middleware` into `main`

## Phase 4: Route Implementation Flow (Incremental Coding & Test Verification)

### Branch: `feature/09-auth-routes`
- **Created from:** `main`
- **Commits:**
  1. `feat: create Zod validation schemas for auth registration and login`
  2. `feat: implement authController register logic with Wallet creation`
  3. `feat: implement authController login logic returning RS256 signed JWT`
  4. `feat: map POST /api/v1/auth/register and POST /api/v1/auth/login routes`
- **Action:** Merge `feature/09-auth-routes` into `main`

### Branch: `feature/10-catalog-routes`
- **Created from:** `main`
- **Commits:**
  1. `feat: create goodSchema for payload validation`
  2. `feat: implement goodController and goodView for catalog creation and retrieval`
  3. `feat: map POST /api/v1/goods (bid-creator only, specifying name, description, category, base price) and GET /api/v1/goods routes`
- **Action:** Merge `feature/10-catalog-routes` into `main`

### Branch: `feature/11-auction-lifecycle`
- **Created from:** `main`
- **Commits:**
  1. `feat: add AuctionResolutionStrategy interface`
  2. `feat: implement EnglishAuctionStrategy logic`
  3. `feat: implement SealedBidAuctionStrategy logic with first-price rules`
  4. `feat: create AuctionStrategyFactory`
  5. `feat: add AuctionState interface and concrete state classes (Draft, Scheduled, Running, Closed, Cancelled)`
  6. `feat: build auction controller for creating (specifying type, parameters, start/end date/time) and manual status transitions (restricted to bid-creator or admin)`
  7. `feat: map CRUD endpoints (including GET with state filtering: not yet open, running, closed, cancelled) and close logic (automatically determine winner based on strategy)`
  8. `feat: implement node-cron in src/jobs/auctionScheduler.ts for background SCHEDULED->RUNNING and RUNNING->CLOSED transitions`
- **Action:** Merge `feature/11-auction-lifecycle` into `main`

### Branch: `feature/12-bidding-and-websockets`
- **Created from:** `main`
- **Commits:**
  1. `feat: install ws library and implement WebSocketManager singleton`
  2. `feat: attach ws upgrade event in server.ts with JWT token query param validation`
  3. `feat: implement bidSchema and bid validation logic evaluating Wallet balances (return 401 Unauthorized if depleted/insufficient credit/JWT)`
  4. `feat: map POST and GET /api/v1/auctions/:id/bids endpoints (bid-participant only; implement history visibility: English is public, Sealed is hidden before close)`
  5. `feat: trigger WS broadcasts for AUCTION_START, PRICE_UPDATE, AUCTION_CLOSE, and AWARD_COMPLETED inside controllers`
- **Action:** Merge `feature/12-bidding-and-websockets` into `main`

### Branch: `feature/13-wallet-management`
- **Created from:** `main`
- **Commits:**
  1. `feat: implement walletController for checking balances`
  2. `feat: map GET /api/v1/wallet/balance (bid-participants only; check remaining credit)`
  3. `feat: map POST /api/v1/admin/wallet/recharge (admin only)`
- **Action:** Merge `feature/13-wallet-management` into `main`

### Branch: `feature/14-history-and-receipts`
- **Created from:** `main`
- **Commits:**
  1. `feat: enforce database transaction wrapping for wallet deductions from winning user upon award and receipt generation in close logic`
  2. `feat: map GET /api/v1/users/me/auctions for participant history (filter by won/lost and date range)`
  3. `feat: map GET /api/v1/users/me/spending for timeframe aggregations`
  4. `feat: implement PDFKit receipt generation (includes Auction ID, good, winner, amount paid, date/time, transaction ID; accessible by winner/admin)`
- **Action:** Merge `feature/14-history-and-receipts` into `main`

### Branch: `feature/15-admin-statistics`
- **Created from:** `main`
- **Commits:**
  1. `feat: build statistics queries for participant metrics (number of auctions, avg/min/max participants over a time interval for each auction type)`
  2. `feat: map GET /api/v1/admin/statistics route for admin analytics`
- **Action:** Merge `feature/15-admin-statistics` into `main`

## Phase 5: Quality, Deployment & Final Documentation

### Branch: `feature/16-testing-suite`
- **Created from:** `main`
- **Commits:**
  1. `test: mock db and write unit tests for authenticateJWT and authorizeRole middlewares`
  2. `test: write unit tests for errorHandler middleware`
  3. `test: write integration tests utilizing supertest for critical API routes`
- **Action:** Merge `feature/16-testing-suite` into `main`

### Branch: `feature/17-docker-app`
- **Created from:** `main`
- **Commits:**
  1. `chore: write multi-stage Dockerfile for TypeScript app compilation`
  2. `chore: extend docker-compose.yml with app service dependent on postgres healthcheck`
- **Action:** Merge `feature/17-docker-app` into `main`

### Branch: `feature/18-final-documentation`
- **Created from:** `main`
- **Commits:**
  1. `docs: finalize UML diagrams for State, Strategy, and Observer patterns`
  2. `docs: complete README instructions (including Design Patterns, Postman test references, and WebSocket usage example)`
- **Action:** Merge `feature/18-final-documentation` into `main`
