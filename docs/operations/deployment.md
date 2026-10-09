# MARSHGO Production Deployment & Infrastructure Runbook

## 1. Containerization Architecture

MARSHGO is containerized using multi-stage Alpine Linux Docker builds:
- **`Dockerfile.api`**: Node.js 22 LTS Alpine runtime compiling TypeScript backend services, running PostgreSQL schema migrations, and hosting HTTP/WebSocket APIs.
- **`Dockerfile.web`**: High-performance static web assets compiled via Vite 8 and served via Caddy or Nginx with Brotli and Gzip compression.
- **`compose.production.yml`**: Docker Compose production orchestration defining:
  - `api`: Node.js Express server.
  - `web`: Caddy reverse proxy serving frontend and proxying `/api` requests.
  - `postgres`: PostgreSQL 16 with PostGIS extension.
  - `redis`: Redis 7 in-memory cache and cluster rate limiter.

## 2. Zero-Downtime Deployment Lifecycle

1. **Pre-flight Check**: Run automated unit and integration tests (`npm test`).
2. **Database Migration**: Execute `npm run migrate` via `server/migrate.ts` ensuring backward-compatible schema evolutions.
3. **Container Spin-up**: Deploy new containers alongside existing running instances.
4. **Health Probe**: Ingress verifies `GET /api/v1/ready` returns HTTP 200 before routing live traffic.
5. **Drain & Cutover**: Gracefully shut down previous instances after ongoing WebSocket/SSE connections drain.

## 3. Rollback Procedure

In the event of an infrastructure incident:
1. Revert container tag in `compose.production.yml`.
2. Execute down migrations if applicable (refer to `ROLLBACK_RUNBOOK.md`).
3. Flush Redis transient cache keys via `redis-cli FLUSHDB`.
