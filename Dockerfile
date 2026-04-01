FROM node:18-alpine AS builder

WORKDIR /app

# Install root deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Install client deps
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build client
RUN cd client && npx vite build

# Build server
RUN npx esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:mysql2 --external:better-sqlite3 --external:react --external:react-dom --external:react/jsx-runtime --external:react-dom/server --external:bcryptjs --format=cjs --target=node18

# Copy client dist to dist/public
RUN cp -r client/dist dist/public

# Production image
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/index.js"]
