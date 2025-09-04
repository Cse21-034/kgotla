# ------------------------------
# Builder stage
# ------------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# ------------------------------
# Production stage
# ------------------------------
FROM node:18-alpine AS production

# Install dumb-init for proper process handling
RUN apk add --no-cache dumb-init

# Create node user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Command to start the app
CMD ["dumb-init", "node", "dist/index.js"]
