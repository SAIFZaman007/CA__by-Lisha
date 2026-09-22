# syntax=docker/dockerfile:1.7
# --- build ---------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=""
ARG VITE_SITE_URL="https://autonomyfitness.press"
# Google Analytics 4 measurement id (public, not a secret). Blank disables GA.
ARG VITE_GA_MEASUREMENT_ID="G-QW8S3X6Q6V"
# Where the build reads programmes/testimonials/gallery from to prerender the
# public pages (scripts/prerender.mjs). Empty = <VITE_SITE_URL>/api/v1, the
# live API. If it is unreachable (e.g. the very first deploy) the build still
# succeeds; those pages are prerendered without that data.
ARG PRERENDER_API_URL=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID \
    PRERENDER_API_URL=$PRERENDER_API_URL
# Client build, server build, then prerender + robots.txt/sitemap/llms.txt.
RUN npm run build

# --- runtime -------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

ENV NGINX_ENVSUBST_FILTER="^(API_ORIGIN|API_UPSTREAM)$$"

ENV API_ORIGIN=""
ENV API_UPSTREAM="http://api:8000"

COPY nginx.conf.template /etc/nginx/templates/coach-auto-frontend.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]