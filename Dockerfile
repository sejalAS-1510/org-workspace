# Multi-stage production Dockerfile for Next.js + Prisma + SQLite
FROM node:20-alpine AS base

# Step 1: Dependencies
FROM base AS deps
RUN apk add --no-libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Step 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client & Push DB schema
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL "file:./dev.db"
RUN npx prisma generate
RUN npx prisma db push
RUN npm run seed
RUN npm run build

# Step 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/dev.db ./dev.db

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
