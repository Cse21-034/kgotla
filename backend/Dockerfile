# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev (for TypeScript build)
RUN npm install

# Copy TypeScript config files
COPY tsconfig*.json ./

# Copy source code
COPY src ./src

# Build the app (TypeScript -> JavaScript)
RUN npm run build

# -----------------------------
# Stage 2: Production
# -----------------------------
FROM node:18-alpine AS production

# Install dumb-init for proper process handling
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only built files and package.json
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Set user
USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
