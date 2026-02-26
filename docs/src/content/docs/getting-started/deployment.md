---
title: Deployment
description: Deploy your Community RSS site with Docker Compose on a VPS.
---

import { Steps, Aside, Tabs, TabItem } from '@astrojs/starlight/components';

## Overview

Community RSS is deployed as a **Node.js standalone server** using Docker
Compose. A typical production stack includes:

- **App container** — Astro SSR running on Node.js
- **FreshRSS** — RSS aggregator (feed source)
- **MinIO** — S3-compatible object storage
- **Reverse proxy** — Caddy or nginx for TLS termination

## Production Docker Compose

The project provides two Compose files:

- `docker-compose.yml` — Base services (FreshRSS, MinIO, Mailpit)
- `docker-compose.prod.yml` — Production overrides (adds the app container,
  removes dev-only services)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### App Dockerfile

The production Dockerfile uses a multi-stage build:

```dockerfile
# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
```

## Environment Variables

Create a `.env` file on the server with production values:

```ini
# Site
PUBLIC_SITE_URL=https://community.example.com

# Database
DATABASE_PATH=/app/data/community.db

# FreshRSS
FRESHRSS_URL=http://freshrss:80
FRESHRSS_USER=admin
FRESHRSS_API_PASSWORD=<secure-password>

# Email (Resend for production)
RESEND_API_KEY=re_xxxxxxxxxxxx
SMTP_FROM=noreply@example.com

# MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET=community-rss
```

<Aside type="tip">
For production email, set `RESEND_API_KEY` to use the Resend provider
instead of raw SMTP. Remove `SMTP_HOST` and `SMTP_PORT` when using Resend.
</Aside>

## Reverse Proxy

### Caddy (Recommended)

<Tabs>
<TabItem label="Caddyfile">

```
community.example.com {
  reverse_proxy app:4321
}
```

</TabItem>
<TabItem label="docker-compose.override.yml">

```yaml
services:
  caddy:
    image: caddy:2
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app

volumes:
  caddy_data:
```

</TabItem>
</Tabs>

Caddy automatically provisions TLS certificates via Let's Encrypt.

### nginx

```nginx
server {
    listen 80;
    server_name community.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name community.example.com;

    ssl_certificate     /etc/letsencrypt/live/community.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/community.example.com/privkey.pem;

    location / {
        proxy_pass http://app:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Data Persistence

Persistent data is stored in Docker volumes:

| Volume | Contents |
|--------|----------|
| `app_data` | SQLite database (`community.db`) |
| `freshrss_data` | FreshRSS configuration and data |
| `minio_data` | Uploaded files (S3 storage) |

### Backups

Back up the SQLite database regularly:

```bash
# Copy the database file from the volume
docker compose cp app:/app/data/community.db ./backups/community-$(date +%F).db
```

<Aside type="caution">
SQLite supports hot backups since the database uses WAL mode, but for
maximum safety, stop the app container before copying.
</Aside>

## Health Checks

The app exposes a health endpoint for monitoring:

```bash
curl -f http://localhost:4321/api/v1/health
```

## Updating

<Steps>

1. Pull the latest code or image
2. Rebuild the app container:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml build app
   ```

3. Restart:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

</Steps>

Database migrations are applied automatically on startup.
