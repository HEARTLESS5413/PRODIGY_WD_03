# ── Frontend Dockerfile ──
# Multi-stage build: Vite build → Nginx static server

# Stage 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Accept build-time environment variables
ARG VITE_API_URL
ARG VITE_SOCKET_URL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS runner

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
