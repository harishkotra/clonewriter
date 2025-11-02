# Multi-stage Dockerfile for CloneWriter with Ollama
# Stage 1: Build Next.js app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Stage 2: Production image with Ollama
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    nodejs \
    npm \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 (Ubuntu comes with older version)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy built Next.js app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Copy additional necessary files
COPY app ./app
COPY components ./components
COPY lib ./lib

# Create directories for data persistence
RUN mkdir -p /app/vector_store /app/data/uploads /root/.ollama

# Create supervisor configuration
RUN mkdir -p /var/log/supervisor

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV OLLAMA_HOST=http://localhost:11434
ENV OLLAMA_MODEL=llama3.2:1b
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose ports
EXPOSE 3000 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/status || exit 1

# Use entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
