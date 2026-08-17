# syntax=docker/dockerfile:1.7
# --- build ---------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Baked in at build time — Vite inlines VITE_* variables into the bundle.
ARG VITE_API_URL=""
ARG VITE_SITE_URL="https://coach-auto.maktechgroups.com"
ARG VITE_GA_MEASUREMENT_ID=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm run build

# --- runtime -------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/coach-auto.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]