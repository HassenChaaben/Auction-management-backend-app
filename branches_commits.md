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

- [ ] ### Branch: `feature/02-project-init`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: initialize package.json and install typescript dependencies`
  * [ ] `feat: configure tsconfig.json for ES2022 target`
  * [ ] `feat: setup basic Jest configuration for testing`
- **Action:** Merge `feature/02-project-init` into `main`

- [ ] ### Branch: `feature/03-security-keys`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: generate RSA RS256 private and public keys for JWT`
  * [ ] `feat: create .env.example and setup dotenv loading`
  * [ ] `chore: configure .gitignore to exclude .env and keys`
- **Action:** Merge `feature/03-security-keys` into `main`

## Phase 2: MVC Structure - Model Layer

- [ ] ### Branch: `feature/04-db-singleton`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: implement database singleton pattern for Sequelize in src/config/database.ts`
- **Action:** Merge `feature/04-db-singleton` into `main`

- [ ] ### Branch: `feature/05-database-models`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: define internal bigint keys and public uuid v4 for User and Wallet models`
  * [ ] `feat: define Good and Auction models with state/type ENUMs and check constraints`
  * [ ] `feat: define Bid and Receipt models with referential integrity rules`
  * [ ] `feat: configure Sequelize associations (1-to-1, 1-to-Many) between models`
  * [ ] `feat: create explicit database indexes on UUIDs and foreign keys`
  * [ ] `chore: generate database migrations for all tables`
- **Action:** Merge `feature/05-database-models` into `main`

- [ ] ### Branch: `feature/06-database-seeds`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: build seeder for admin profile and bid-creators`
  * [ ] `feat: build seeder for bid-participants with populated Wallets (10,000 tokens)`
  * [ ] `feat: seed historical active/closed auctions and bids for analytics testing`
- **Action:** Merge `feature/06-database-seeds` into `main`

## Phase 3: MVC Structure - Routing Gateway & Server Shell

- [ ] ### Branch: `feature/07-server-shell`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: setup base Express router initialization in src/app.ts`
  * [ ] `feat: implement centralized async errorHandler middleware mapping AppError classes`
  * [ ] `feat: add errorView.ts to serialize clean JSON error responses`
- **Action:** Merge `feature/07-server-shell` into `main`

- [ ] ### Branch: `feature/08-auth-middleware`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: implement authenticateJWT middleware utilizing Bearer Token headers (ensure JWT contains ONLY user metadata)`
  * [ ] `feat: implement authorizeRole proxy middleware for RBAC checks`
  * [ ] `feat: add validateRequest middleware using Zod/Joi schemas`
- **Action:** Merge `feature/08-auth-middleware` into `main`

## Phase 4: Route Implementation Flow (Incremental Coding & Test Verification)

- [ ] ### Branch: `feature/09-auth-routes`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: create Zod validation schemas for auth registration and login`
  * [ ] `feat: implement authController register logic with Wallet creation`
  * [ ] `feat: implement authController login logic returning RS256 signed JWT`
  * [ ] `feat: map POST /api/v1/auth/register and POST /api/v1/auth/login routes`
- **Action:** Merge `feature/09-auth-routes` into `main`

- [ ] ### Branch: `feature/10-catalog-routes`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: create goodSchema for payload validation`
  * [ ] `feat: implement goodController and goodView for catalog creation and retrieval`
  * [ ] `feat: map POST /api/v1/goods (bid-creator only, specifying name, description, category, base price) and GET /api/v1/goods routes`
- **Action:** Merge `feature/10-catalog-routes` into `main`

- [ ] ### Branch: `feature/11-auction-lifecycle`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: add AuctionResolutionStrategy interface`
  * [ ] `feat: implement EnglishAuctionStrategy logic`
  * [ ] `feat: implement SealedBidAuctionStrategy logic with first-price rules`
  * [ ] `feat: create AuctionStrategyFactory`
  * [ ] `feat: add AuctionState interface and concrete state classes (Draft, Scheduled, Running, Closed, Cancelled)`
  * [ ] `feat: build auction controller for creating (specifying type, parameters, start/end date/time) and manual status transitions (restricted to bid-creator or admin)`
  * [ ] `feat: map CRUD endpoints (including GET with state filtering: not yet open, running, closed, cancelled) and close logic (automatically determine winner based on strategy)`
  * [ ] `feat: implement node-cron in src/jobs/auctionScheduler.ts for background SCHEDULED->RUNNING and RUNNING->CLOSED transitions`
- **Action:** Merge `feature/11-auction-lifecycle` into `main`

- [ ] ### Branch: `feature/12-bidding-and-websockets`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: install ws library and implement WebSocketManager singleton`
  * [ ] `feat: attach ws upgrade event in server.ts with JWT token query param validation`
  * [ ] `feat: implement bidSchema and bid validation logic evaluating Wallet balances (return 401 Unauthorized if depleted/insufficient credit/JWT)`
  * [ ] `feat: map POST and GET /api/v1/auctions/:id/bids endpoints (bid-participant only; implement history visibility: English is public, Sealed is hidden before close)`
  * [ ] `feat: trigger WS broadcasts for AUCTION_START, PRICE_UPDATE, AUCTION_CLOSE, and AWARD_COMPLETED inside controllers`
- **Action:** Merge `feature/12-bidding-and-websockets` into `main`

- [ ] ### Branch: `feature/13-wallet-management`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: implement walletController for checking balances`
  * [ ] `feat: map GET /api/v1/wallet/balance (bid-participants only; check remaining credit)`
  * [ ] `feat: map POST /api/v1/admin/wallet/recharge (admin only)`
- **Action:** Merge `feature/13-wallet-management` into `main`

- [ ] ### Branch: `feature/14-history-and-receipts`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: enforce database transaction wrapping for wallet deductions from winning user upon award and receipt generation in close logic`
  * [ ] `feat: map GET /api/v1/users/me/auctions for participant history (filter by won/lost and date range)`
  * [ ] `feat: map GET /api/v1/users/me/spending for timeframe aggregations`
  * [ ] `feat: implement PDFKit receipt generation (includes Auction ID, good, winner, amount paid, date/time, transaction ID; accessible by winner/admin)`
- **Action:** Merge `feature/14-history-and-receipts` into `main`

- [ ] ### Branch: `feature/15-admin-statistics`
- **Created from:** `main`
- **Commits:**
  * [ ] `feat: build statistics queries for participant metrics (number of auctions, avg/min/max participants over a time interval for each auction type)`
  * [ ] `feat: map GET /api/v1/admin/statistics route for admin analytics`
- **Action:** Merge `feature/15-admin-statistics` into `main`

## Phase 5: Quality, Deployment & Final Documentation

- [ ] ### Branch: `feature/16-testing-suite`
- **Created from:** `main`
- **Commits:**
  * [ ] `test: mock db and write unit tests for authenticateJWT and authorizeRole middlewares`
  * [ ] `test: write unit tests for errorHandler middleware`
  * [ ] `test: write integration tests utilizing supertest for critical API routes`
- **Action:** Merge `feature/16-testing-suite` into `main`

- [ ] ### Branch: `feature/17-docker-app`
- **Created from:** `main`
- **Commits:**
  * [ ] `chore: write multi-stage Dockerfile for TypeScript app compilation`
  * [ ] `chore: extend docker-compose.yml with app service dependent on postgres healthcheck`
- **Action:** Merge `feature/17-docker-app` into `main`

- [ ] ### Branch: `feature/18-final-documentation`
- **Created from:** `main`
- **Commits:**
  * [ ] `docs: finalize UML diagrams for State, Strategy, and Observer patterns`
  * [ ] `docs: complete README instructions (including Design Patterns, Postman test references, and WebSocket usage example)`
- **Action:** Merge `feature/18-final-documentation` into `main`
