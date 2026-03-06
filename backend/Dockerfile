FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build-deps
COPY package*.json ./
RUN npm ci

# Build
FROM build-deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

# Copy prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy production deps
COPY --from=deps /app/node_modules ./node_modules

# Copy built code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create uploads dir
RUN mkdir -p /app/uploads

EXPOSE 4000

# Run migrations then start
CMD sh -c "npx prisma migrate deploy && node dist/server.js"
