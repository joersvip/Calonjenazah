# Build stage for React frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root server package manifests and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code and database directory
COPY server/ ./server/
COPY .env* ./

# Copy built frontend assets
COPY --from=client-builder /app/client/dist ./client/dist

# Expose HTTP port
EXPOSE 5000

# Persistent data volume for SQLite
VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
