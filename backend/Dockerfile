# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev (for TypeScript build)
RUN npm install

# Copy TypeScript config files and other configs first
COPY tsconfig*.json ./
COPY prisma ./prisma   # if using Prisma, adjust accordingly
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

# Set working directory
WORKDIR /app

# Copy only built files and package.json (no dev dependencies)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy any runtime config files needed
COPY --from=builder /app/prisma ./prisma   # optional, if Prisma used

# Set user
USER nodejs

# Expose your app port
EXPOSE 3000

# Start the app
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
