# Project Branches and Commits Workflow

This document outlines the branches and commits for the Catalog of Goods and Auction Management System backend. 
As per the workflow: **each new branch is created from `main`** (which contains the previously merged work), and after the commits are made, it is **merged back into `main`**.

## Phase 1: Infrastructure & DB Setup

- [x] ### Branch: `feature/01-docker-db`
- **Created from:** `main`
- **Commits:**
  * [x] `chore: add docker/.env with postgres credentials`
  * [x] `chore: create docker-compose.yml for postgres service with healthchecks and volumes`
- **Action:** Merge `feature/01-docker-db` into `main`

- [x] ### Branch: `feature/02-project-init`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: initialize package.json and install typescript dependencies`
  * [x] `feat: configure tsconfig.json for ES2022 target`
  * [x] `feat: setup basic Jest configuration for testing`
- **Action:** Merge `feature/02-project-init` into `main`

- [x] ### Branch: `feature/03-security-keys`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: generate RSA RS256 private and public keys for JWT`
  * [x] `feat: create .env.example and setup dotenv loading`
  * [x] `chore: configure .gitignore to exclude .env and keys`
- **Action:** Merge `feature/03-security-keys` into `main`

## Phase 2: MVC Structure - Model Layer

- [x] ### Branch: `feature/04-db-singleton`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: implement database singleton pattern for Sequelize in src/config/database.ts`
- **Action:** Merge `feature/04-db-singleton` into `main`

- [x] ### Branch: `feature/05-database-models`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: define internal bigint keys and public uuid v4 for User and Wallet models`
  * [x] `feat: define Good and Auction models with state/type ENUMs and check constraints`
  * [x] `feat: define Bid and Receipt models with referential integrity rules`
  * [x] `feat: configure Sequelize associations (1-to-1, 1-to-Many) between models`
  * [x] `feat: create explicit database indexes on UUIDs and foreign keys`
  * [x] `chore: generate database migrations for all tables`
- **Action:** Merge `feature/05-database-models` into `main`

- [x] ### Branch: `feature/06-database-seeds`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: build seeder for admin profile and bid-creators`
  * [x] `feat: build seeder for bid-participants with populated Wallets (10,000 tokens)`
  * [x] `feat: seed historical active/closed auctions and bids for analytics testing`
- **Action:** Merge `feature/06-database-seeds` into `main`

## Phase 3: MVC Structure - Routing Gateway & Server Shell

- [x] ### Branch: `feature/07-server-shell`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: setup base Express router initialization in src/app.ts`
  * [x] `feat: implement centralized async errorHandler middleware mapping AppError classes`
  * [x] `feat: add errorView.ts to serialize clean JSON error responses`
- **Action:** Merge `feature/07-server-shell` into `main`

- [x] ### Branch: `feature/08-auth-middleware`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: implement authenticateJWT middleware utilizing Bearer Token headers (ensure JWT contains ONLY user metadata)`
  * [x] `feat: implement authorizeRole proxy middleware for RBAC checks`
  * [x] `feat: add validateRequest middleware using Zod/Joi schemas`
- **Action:** Merge `feature/08-auth-middleware` into `main`

## Phase 4: Route Implementation Flow (Incremental Coding & Test Verification)

- [x] ### Branch: `feature/09-auth-routes`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: create Zod validation schemas for auth registration and login`
  * [x] `feat: implement authController register logic with Wallet creation`
  * [x] `feat: implement authController login logic returning RS256 signed JWT`
  * [x] `feat: map POST /api/v1/auth/register and POST /api/v1/auth/login routes`
- **Action:** Merge `feature/09-auth-routes` into `main`

- [x] ### Branch: `feature/10-catalog-routes`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: create goodSchema for payload validation`
  * [x] `feat: implement goodController and goodView for catalog creation and retrieval`
  * [x] `feat: map POST /api/v1/goods (bid-creator only, specifying name, description, category, base price) and GET /api/v1/goods routes`
- **Action:** Merge `feature/10-catalog-routes` into `main`

- [x] ### Branch: `feature/11-auction-lifecycle`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: add AuctionResolutionStrategy interface`
  * [x] `feat: implement EnglishAuctionStrategy logic`
  * [x] `feat: implement SealedBidAuctionStrategy logic with first-price rules`
  * [x] `feat: create AuctionStrategyFactory`
  * [x] `feat: add AuctionState interface and concrete state classes (Draft, Scheduled, Running, Closed, Cancelled)`
  * [x] `feat: build auction controller for creating (specifying type, parameters, start/end date/time) and manual status transitions (restricted to bid-creator or admin)`
  * [x] `feat: map CRUD endpoints (including GET with state filtering: not yet open, running, closed, cancelled) and close logic (automatically determine winner based on strategy)`
  * [x] `feat: implement node-cron in src/jobs/auctionScheduler.ts for background SCHEDULED->RUNNING and RUNNING->CLOSED transitions`
- **Action:** Merge `feature/11-auction-lifecycle` into `main`

- [x] ### Branch: `feature/12-bidding-and-websockets`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: install ws library and implement WebSocketManager singleton`
  * [x] `feat: attach ws upgrade event in server.ts with JWT token query param validation`
  * [x] `feat: implement bidSchema and bid validation logic evaluating Wallet balances (return 401 Unauthorized if depleted/insufficient credit/JWT)`
  * [x] `feat: map POST and GET /api/v1/auctions/:id/bids endpoints (bid-participant only; implement history visibility: English is public, Sealed is hidden before close)`
  * [x] `feat: trigger WS broadcasts for AUCTION_START, PRICE_UPDATE, AUCTION_CLOSE, and AWARD_COMPLETED inside controllers`
- **Action:** Merge `feature/12-bidding-and-websockets` into `main`

- [x] ### Branch: `feature/13-wallet-management`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: implement walletController for checking balances`
  * [x] `feat: map GET /api/v1/wallet/balance (bid-participants only; check remaining credit)`
  * [x] `feat: map POST /api/v1/admin/wallet/recharge (admin only)`
- **Action:** Merge `feature/13-wallet-management` into `main`

- [x] ### Branch: `feature/14-history-and-receipts`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: enforce database transaction wrapping for wallet deductions from winning user upon award and receipt generation in close logic`
  * [x] `feat: map GET /api/v1/users/me/auctions for participant history (filter by won/lost and date range)`
  * [x] `feat: map GET /api/v1/users/me/spending for timeframe aggregations`
  * [x] `feat: implement PDFKit receipt generation (includes Auction ID, good, winner, amount paid, date/time, transaction ID; accessible by winner/admin)`
- **Action:** Merge `feature/14-history-and-receipts` into `main`

- [x] ### Branch: `feature/15-admin-statistics`
- **Created from:** `main`
- **Commits:**
  * [x] `feat: build statistics queries for participant metrics (number of auctions, avg/min/max participants over a time interval for each auction type)`
  * [x] `feat: map GET /api/v1/admin/statistics route for admin analytics`
- **Action:** Merge `feature/15-admin-statistics` into `main`

## Phase 5: Quality, Deployment & Final Documentation

- [x] ### Branch: `feature/16-testing-suite`
- **Created from:** `main`
- **Commits:**
  * [x] `test: mock db and write unit tests for authenticateJWT and authorizeRole middlewares`
  * [x] `test: write unit tests for errorHandler middleware`
  * [x] `test: write integration tests utilizing supertest for critical API routes`
- **Action:** Merge `feature/16-testing-suite` into `main`

- [x] ### Branch: `feature/17-docker-app`
- **Created from:** `main`
- **Commits:**
  * [x] `chore: write multi-stage Dockerfile for TypeScript app compilation`
  * [x] `chore: extend docker-compose.yml with app service dependent on postgres healthcheck`
- **Action:** Merge `feature/17-docker-app` into `main`

- [x] ### Branch: `feature/18-final-documentation`
- **Created from:** `main`
- **Commits:**
  * [x] `docs: finalize UML diagrams for State, Strategy, and Observer patterns`
  * [x] `docs: complete README instructions (including Design Patterns, Postman test references, and WebSocket usage example)`
- **Action:** Merge `feature/18-final-documentation` into `main`
