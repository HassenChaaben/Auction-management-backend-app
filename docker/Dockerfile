# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including devDependencies) for TypeScript compilation
RUN npm ci

# Copy application sources and tsconfig
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Remove development dependencies to keep final image clean
RUN npm prune --production

# ─── Stage 2: Production Runtime ──────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package descriptors
COPY package*.json ./

# Copy node_modules with production-only dependencies
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy compiled JavaScript output
COPY --from=build /usr/src/app/dist ./dist

# Copy migrations, seeders, models, and .sequelizerc for db migrations inside container
COPY .sequelizerc ./
COPY src/db/ ./src/db/
COPY src/models/ ./src/models/

# Copy other necessary runtime files (like keys, public certificate placeholders)
# Note: actual private keys and credentials must be injected at runtime via environment variables.

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
