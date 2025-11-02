# Multi-stage build for optimal image size
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin

# Set environment
ENV NODE_ENV=production

# Create volume for workspace
VOLUME ["/workspace"]
WORKDIR /workspace

# Entrypoint
ENTRYPOINT ["node", "/app/bin/run.js"]

# Default command
CMD ["--help"]
