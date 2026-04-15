# External Integrations

**Analysis Date:** 2026-04-14

## APIs & External Services

**Authentication:**
- Custom middleware `authMiddleware` in `apps/api/src/middleware/auth.ts`.
- Validates Bearer token using `AuthService`.
- Current implementation is a skeleton placeholder in `apps/api/src/services/auth.ts`.

**Internationalization:**
- `i18next` - Localized for Hebrew (`he`) and English (`en`) in `apps/web/src/locales/`.

## Data Storage

**Databases:**
- PostgreSQL
- Connection: `DATABASE_URL` env var.
- Client: `drizzle-orm` (Node Postgres driver).
- Schema defined in `packages/db/src/schema.ts`.

**File Storage:**
- Abstracted in `packages/storage/src/storage.ts`.
- Implements `StorageService` for file uploads/downloads.
- Current implementation is a mock in `packages/storage/src/storage.ts`.

**Caching:**
- None detected.

## Authentication & Identity

**Auth Provider:**
- Skeleton service `AuthService` in `apps/api/src/services/auth.ts`.
- Expected to integrate with a provider like Supabase or Firebase in production.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Standard console logging in `apps/api/src/index.ts`.
- `app.onError` global handler in Hono.

## CI/CD & Deployment

**Hosting:**
- Docker support via `docker-compose.yml` (database and apps).

**CI Pipeline:**
- None detected.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` (DB connection)
- `PORT` (API port, defaults to 3002)

**Secrets location:**
- `.env` files (not committed).
- `.env.example` provided for reference.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2026-04-14*
