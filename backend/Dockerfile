# ── Backend Dockerfile ──
# Multi-stage build: production dependencies only (~120MB vs ~500MB+)

FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Install production dependencies
FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Production runtime
FROM base AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER appuser

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
