# StudyOS — Product Requirements Document (v2 — SaaS-Ready + Hebrew RTL)

## Overview

StudyOS is an academic management web application for university students. It centralizes the university schedule, per-course assignment tracking, and study resource organization (HTML summaries, PDFs, Word docs, and other files) into a single interface. Originally designed for personal self-hosting, v2 targets a multi-tenant SaaS model to allow public marketing and sign-up, while retaining a self-host option for privacy-conscious users.

---

## What Changed from v1

Two strategic updates drive this revision:

1. **Hebrew / RTL is a first-class requirement** — all layouts, components, and UI text must render correctly in right-to-left mode with Hebrew as the primary language.
2. **Multi-tenant SaaS architecture** — the system must support unlimited registered users, each with their own isolated workspace, enabling a public product with sign-up, plans, and potential monetization.

---

## Architecture: How Going Multi-Tenant Changes Everything

### v1 (Self-Host, 1–5 users) vs v2 (SaaS, unlimited)

| Concern | v1 Architecture | v2 Architecture |
|---|---|---|
| **Database** | SQLite, single file | PostgreSQL — handles concurrent writes, row-level isolation[cite:21] |
| **Multi-tenancy model** | Single user table, shared schema | Shared schema with `tenant_id` on every table (most practical for <10k tenants)[cite:23] |
| **File storage** | Local `/data/uploads/` folder | Object storage — S3-compatible (Cloudflare R2 recommended for cost) |
| **Auth** | Simple JWT, single admin | Full auth service — Clerk, Auth.js, or self-hosted (Supabase Auth) |
| **Deployment** | `docker-compose up` on personal VPS | Multi-instance ready; stateless backend behind a load balancer |
| **Billing** | None | Stripe integration for paid plans (optional; freemium model) |
| **Rate limiting** | Not needed | Per-tenant rate limiting via Redis or upstash |
| **Backups** | Copy one `.db` file | Automated PostgreSQL WAL backups (pg_dump + S3) |

### Why PostgreSQL over SQLite for SaaS

SQLite serializes all writes — every write locks the entire file [cite:21]. With even 20 concurrent users uploading files or updating assignments simultaneously, you'll hit write contention. PostgreSQL supports hundreds to thousands of concurrent connections, row-level locking, and horizontal scaling via read replicas [cite:21]. SQLite remains a great choice for the self-host tier (single user), and the codebase can support both via an ORM abstraction layer (Drizzle ORM supports both).

### Multi-Tenancy Model: Shared Schema

For an early-stage SaaS with hundreds to low-thousands of tenants, a **shared schema with `tenant_id`** on every table is the best balance of simplicity and isolation [cite:23]:

```sql
-- Every table includes tenant_id
CREATE TABLE courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  color       TEXT,
  ...
);

-- Row-level security enforces isolation at the DB level
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON courses
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

PostgreSQL Row Level Security (RLS) ensures one tenant can never accidentally read another's data — even if the application layer has a bug [cite:25].

### Tenant Model

A **tenant** in StudyOS is one user's workspace. For the academic use case, a tenant = one student's account. Groups of students sharing a workspace (e.g., study groups) share one tenant, with per-member roles inside it.

```
Tenant (= one student workspace)
  └── Members (owner + invited collaborators)
  └── Courses
      └── Schedule Slots
      └── Assignments
      └── Resources (files)
```

---

## Revised Technical Stack

| Layer | v1 Choice | v2 Choice | Reason |
|---|---|---|---|
| **Database** | SQLite | **PostgreSQL** (Supabase or self-hosted) | Concurrent writes, RLS, scale[cite:21] |
| **ORM** | Drizzle | **Drizzle** (unchanged) | Supports both SQLite + PostgreSQL |
| **File Storage** | Local FS | **Cloudflare R2** (S3-compatible) | Cheap, no egress fees, global CDN |
| **Auth** | Custom JWT | **Supabase Auth** or **Clerk** | Multi-tenant sessions, social login, magic link |
| **Backend** | Hono + Node.js | **Hono + Node.js** (unchanged) | Add tenant proxy (formerly middleware) |
| **Edge Logic** | Middleware | **Proxy** | Renamed `middleware.ts` to `proxy.ts` per Next.js v16+ convention |
| **Frontend** | React + Vite | **React + Vite** (unchanged) | Add i18next + RTL CSS |
| **Cache / Rate limit** | None | **Upstash Redis** | Per-tenant rate limiting, session cache |
| **Deploy** | docker-compose | **Docker + Easypanel** or **Railway/Fly.io** | Zero-downtime deploys, auto-scaling |
| **Payments** | None | **Stripe** (optional) | Free tier + paid plans |

### Self-Host Tier Still Supported

Offer a **single-tenant Docker image** that uses SQLite + local storage — no PostgreSQL, no R2, no Stripe. This is ideal for the privacy-focused user and also serves as a free marketing channel (open-source core). The same codebase works for both via environment variable flags:

```env
# Self-host mode
STORAGE_DRIVER=local
DB_DRIVER=sqlite
MULTI_TENANT=false

# SaaS mode
STORAGE_DRIVER=r2
DB_DRIVER=postgres
MULTI_TENANT=true
```

---

## Hebrew RTL — Implementation Plan

### Core Principle

RTL is not a theme or an option — for Hebrew users, it's the correct default. The entire layout must flip: navigation, sidebars, form fields, icons with directional meaning, and text alignment.

### CSS Strategy

Use the CSS `dir` attribute on `<html>` and CSS logical properties throughout — never use `left`/`right` directly:

```css
/* ❌ Wrong — breaks in RTL */
.sidebar { left: 0; margin-left: 16px; }

/* ✅ Correct — works in both LTR and RTL */
.sidebar { inset-inline-start: 0; margin-inline-start: 1rem; }
```

CSS logical properties to always use:

| Physical (avoid) | Logical (use) |
|---|---|
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `border-left` | `border-inline-start` |
| `text-align: left` | `text-align: start` |
| `float: right` | `float: inline-end` |
| `left: 0` | `inset-inline-start: 0` |

### i18n Library

Use **i18next + react-i18next** with two locale files:

```
src/locales/
├── he.json   ← Hebrew (primary, RTL)
└── en.json   ← English (secondary, LTR)
```

Set `dir` on `<html>` based on locale:

```tsx
// App.tsx
const { i18n } = useTranslation();
useEffect(() => {
  document.documentElement.dir = i18n.language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

### Typography for Hebrew

Hebrew requires a font that supports the Hebrew Unicode block (`U+0590–U+05FF`). Recommended:

- **Heebo** (Google Fonts) — clean, modern, excellent Hebrew support, variable font
- **Rubik** (Google Fonts) — slightly more rounded, also excellent for Hebrew
- **Assistant** (Google Fonts) — narrower, good for dense UI

```html
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300..800&display=swap" rel="stylesheet">
```

```css
--font-body: 'Heebo', 'Arial Hebrew', sans-serif;
--font-display: 'Heebo', 'Arial Hebrew', sans-serif;
```

Heebo works for both Hebrew and Latin characters, so no font switching between languages is needed.

### Directional Icons

Some icons have inherent direction and must flip in RTL:

```tsx
// Flip directional icons in RTL
const ArrowIcon = () => (
  <svg style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} .../>
);
```

Icons that flip: arrows, chevrons, back/forward buttons, progress indicators.
Icons that do NOT flip: play/pause, checkmarks, warning signs, upload/download.

### Date & Number Formatting

Hebrew locale uses standard Western numerals but right-to-left date reading. Use `Intl.DateTimeFormat` with the `he-IL` locale:

```ts
new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
// → "שני, 13 באפריל"
```

---

## SaaS Business Model

### Plans (Suggested)

| Plan | Price | Storage | Courses | Collaborators |
|---|---|---|---|---|
| **Free** | ₪0 | 500 MB | Up to 6 | 0 |
| **Student+** | ₪15/mo | 5 GB | Unlimited | 3 |
| **Study Group** | ₪35/mo | 20 GB | Unlimited | 10 |

### Monetization Notes

- Free tier is generous enough to attract users organically (university students are price-sensitive)
- Storage is the natural usage-based upgrade trigger — large PDF libraries fill 500 MB quickly
- Target Israeli university students initially (Hebrew-first), then expand to Arabic (`ar` is also RTL, same CSS infrastructure)

---

## Updated Data Model (Multi-Tenant)

```sql
tenants       (id, name, plan, created_at, storage_used_bytes)
users         (id, tenant_id, email, name, role: owner|collaborator|viewer, created_at)
courses       (id, tenant_id, name, code, color, lecturer, credits)
schedule_slots(id, tenant_id, course_id, day_of_week, start_time, end_time, room, type)
assignments   (id, tenant_id, course_id, title, description, due_date, status, priority, grade)
resources     (id, tenant_id, course_id, title, type, file_key, category, tags[], uploaded_at)
```

Every query in the application layer must filter by `tenant_id`. PostgreSQL RLS enforces this at the database level as a safety net.

---

## Updated Milestones

| Milestone | Features | Est. Effort |
|---|---|---|
| M1 — Core + Auth | Tenant model, Supabase Auth, basic nav | 2 days |
| M2 — RTL + i18n | Hebrew locale, Heebo font, logical CSS properties, dir toggle | 1–2 days |
| M3 — Schedule | Timetable grid, RTL-aware layout | 2 days |
| M4 — Assignments | CRUD, global view, overdue flags | 2 days |
| M5 — Resources | File upload to R2, PDF/HTML/DOCX viewer | 2–3 days |
| M6 — Dashboard | Today strip, upcoming, stats | 1 day |
| M7 — Sharing | Invite links, role permissions | 1–2 days |
| M8 — SaaS infra | Plans, storage quotas, Stripe (optional) | 2–3 days |
| M9 — Polish + Deploy | Dark mode, PWA, Docker, Easypanel deploy | 1–2 days |

**Total estimated v2 build time: ~16–20 focused dev days**

---

## v2 Open Questions

1. Should the SaaS offering start with a waitlist (collect emails) before building billing, or launch free-only first?
2. Is Supabase the right choice for auth + database (simplest path), or do you prefer a fully self-controlled stack?
3. Arabic RTL support in v1 alongside Hebrew, or later?
4. Should the self-host Docker image be open-source (drives SaaS signups) or source-available?

