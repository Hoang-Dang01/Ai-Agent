# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 orchestrator

# Copy production dependencies and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set permissions
RUN chown -R orchestrator:nodejs /app

USER orchestrator

EXPOSE 4000
ENV PORT=4000

CMD ["node", "server.js"]
