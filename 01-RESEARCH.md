# Phase 1: Core + Auth - Research

**Researched:** 2026-04-14
**Domain:** Auth & Multi-tenancy (Supabase + Hono + RLS)
**Confidence:** HIGH

## Summary

This research focuses on implementing a secure, multi-tenant architecture using Supabase Auth, Hono, and PostgreSQL Row-Level Security (RLS). The core challenge is bridging the gap between the application layer (Hono) and the database layer (PostgreSQL) to ensure that every query is strictly isolated by `tenant_id` without manual filtering in every repository method.

**Primary recommendation:** Use `hono/jwt` middleware to verify Supabase JWTs, extract `tenant_id` from `app_metadata`, and inject it into the database session using `set_config('app.current_tenant', ...)` within a Drizzle transaction. Enforce isolation using PostgreSQL RLS with a policy that reads from this session variable.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `hono` | 4.5.4 | Web Framework | Lightweight, edge-ready, excellent middleware support. |
| `hono/jwt` | (Built-in) | JWT Verification | Native Hono middleware for validating and parsing JWTs. |
| `drizzle-orm` | 0.33.0 | ORM | Type-safe, supports both PostgreSQL and SQLite. |
| `supabase-js` | 2.x | Auth / DB Client | Official SDK for interacting with Supabase services. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/ssr` | 0.x | SSR Auth | Use if implementing cookie-based auth/SSR in the future. |
| `pg` | 8.20.0 | DB Driver | Standard driver for Node-Postgres used by Drizzle. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `hono/jwt` | `@supabase/supabase-js` | Using the SDK to verify tokens requires a network call (`getUser()`) unless the SDK is configured to parse locally. `hono/jwt` is faster (local verification). |
| RLS | Manual `WHERE` | Error-prone; developers can forget the filter. RLS is a database-level safety net. |

**Installation:**
```bash
npm install hono @supabase/supabase-js drizzle-orm pg
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── middleware/
│   ├── auth.ts       # JWT verification & User extraction
│   └── tenant.ts     # Tenant context setup
├── services/
│   └── auth.ts       # Supabase client & validation logic
└── index.ts          # App entry & Route groups
packages/db/src/
├── schema.ts         # Multi-tenant tables with tenant_id
└── rls.ts            # RLS helpers (setTenant, withTenant)
```

### Pattern 1: JWT Custom Claims for Multi-Tenancy
**What:** Store `tenant_id` directly in the JWT to avoid database lookups on every request.
**When to use:** In all multi-tenant SaaS applications using Supabase.
**Implementation:** Use a PostgreSQL trigger on `auth.users` to sync `tenant_id` into `raw_app_meta_data`.

### Pattern 2: RLS via Session Variables
**What:** Set a session-local variable `app.current_tenant` at the start of every transaction.
**When to use:** When using a centralized connection pool (Node.js) where multiple tenants share the same DB user.
**Example:**
```sql
-- RLS Policy
CREATE POLICY tenant_isolation_policy ON courses
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### Anti-Patterns to Avoid
- **Header-based Tenant ID:** Never trust `x-tenant-id` headers from the client without verifying them against the JWT claims.
- **Superuser DB Connection:** Connecting to Postgres as the `postgres` user bypasses RLS entirely. Use a dedicated `api_user` role.
- **Global `set_config`:** Setting session variables without the `is_local=true` flag inside a transaction can lead to "leakage" between concurrent requests in a pool.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT Verification | Manual `jwt.verify` | `hono/jwt` | Handles header parsing, algorithm checking, and context injection correctly. |
| RLS Logic | Manual `WHERE` clauses | Postgres RLS | Prevents data leaks even if application code is buggy. |
| User Syncing | Application-side sync | Postgres Triggers | Ensures `auth.users` and `public.profiles` stay in sync regardless of sign-up method (Social, Email, etc). |

## Common Pitfalls

### Pitfall 1: Superuser RLS Bypass
**What goes wrong:** RLS policies are ignored, and one tenant sees another's data.
**Why it happens:** The `postgres` user and any user with the `SUPERUSER` or `BYPASSRLS` attribute ignore RLS by default.
**How to avoid:** Use a non-superuser role (e.g., `authenticated`) for the application's database connection.
**Warning signs:** `SELECT *` returns rows for all tenants even after `set_config` is called.

### Pitfall 2: Stale JWT Claims
**What goes wrong:** A user is moved to a new tenant, but still accesses the old one.
**Why it happens:** JWT claims are only updated when a new token is issued (on login or refresh).
**How to avoid:** Force a session refresh (`supabase.auth.refreshSession()`) on the client after tenant changes.

### Pitfall 3: Owner Bypass
**What goes wrong:** The user who created the tables (often the migration user) bypasses RLS.
**How to avoid:** Use `ALTER TABLE ... FORCE ROW LEVEL SECURITY;`.

## Code Examples

### 1. Supabase Trigger: Sync `tenant_id` to JWT
```sql
-- Source: Official Supabase Custom Claims Pattern
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- 1. Create a new tenant
  INSERT INTO public.tenants (name) VALUES (NEW.email) RETURNING id INTO new_tenant_id;
  
  -- 2. Create public profile
  INSERT INTO public.users (id, tenant_id, email)
  VALUES (NEW.id, new_tenant_id, NEW.email);

  -- 3. Inject tenant_id into JWT (app_metadata)
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(new_tenant_id::text)
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Hono Middleware: Secure JWT & Tenant Extraction
```typescript
// apps/api/src/middleware/auth.ts
import { jwt } from "hono/jwt";

export const authMiddleware = (c, next) => {
  const middleware = jwt({
    secret: process.env.SUPABASE_JWT_SECRET!,
    alg: "HS256",
  });
  return middleware(c, next);
};

// apps/api/src/middleware/tenant.ts
export const tenantMiddleware = async (c, next) => {
  const payload = c.get("jwtPayload");
  const tenantId = payload?.app_metadata?.tenant_id;

  if (!tenantId) {
    return c.json({ error: "Unauthorized: Missing tenant context" }, 401);
  }

  c.set("tenantId", tenantId);
  await next();
};
```

### 3. Drizzle RLS Helper
```typescript
// packages/db/src/rls.ts
export async function withTenant<T>(
  db: any,
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set local variable for the duration of this transaction only
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${tenantId}, true)`);
    return await callback(tx);
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multi-db per tenant | Shared schema + RLS | Post-2020 | Lower cost, easier migrations, manageable scaling. |
| Metadata in DB only | Metadata in JWT | Post-2021 | Removes DB lookup from auth path; improves latency. |
| Manual SQL RLS | Drizzle + Transaction Helpers | 2023 | Type-safe multi-tenancy in Node.js. |

## Open Questions

1. **Self-Host Strategy:** The PRD mentions a single-tenant self-host mode. Should this bypass RLS or use a "default" tenant ID?
   - *Recommendation:* Use a default constant `tenant_id` for self-hosted mode to keep the code path identical.
2. **Multiple Tenants:** If a user belongs to multiple tenants (collaborator), how do they switch?
   - *Recommendation:* For M1, assume 1-to-1. For M7 (Sharing), the client should pass the desired `tenant_id` in a header, and the server verifies it against a `memberships` table.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data Layer | ✓ | 15.x | — |
| Supabase Auth | Identity | ✓ | — | — |
| `SUPABASE_JWT_SECRET` | Token Verification | ✓ | — | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| AUTH-01 | JWT Verification | Integration | `npm test auth.test.ts` |
| AUTH-02 | Tenant Isolation (RLS) | Database | `npm test rls.test.ts` |
| AUTH-03 | Custom Claims | Smoke | `npm test claims.test.ts` |

## Sources

### Primary (HIGH confidence)
- [Supabase Docs - Custom Claims](https://supabase.com/docs/guides/auth/auth-hooks) - Implementation of JWT claims.
- [Hono Docs - JWT Middleware](https://hono.dev/middleware/builtin/jwt) - Token verification patterns.
- [PostgreSQL Docs - RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) - Security policy syntax.

### Secondary (MEDIUM confidence)
- Community patterns for Drizzle + RLS (found on GitHub/Reddit).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are current and well-documented.
- Architecture: HIGH - RLS + JWT claims is the "gold standard" for Supabase multi-tenancy.
- Pitfalls: HIGH - Common superuser bypass is well-documented.

**Research date:** 2026-04-14
**Valid until:** 2026-05-14
