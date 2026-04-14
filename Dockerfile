# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

# better-sqlite3 needs native compilation tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: build the Next.js app ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# Create the data directory and set ownership for the SQLite DB volume
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# Mount /app/data as a volume to persist the SQLite database
VOLUME ["/app/data"]

CMD ["npm", "start"]
