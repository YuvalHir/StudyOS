# StudyOS — Product Requirements Document (v2 — SaaS-Ready + Hebrew RTL)

## Overview

StudyOS is an academic management web application for university students. It centralizes the university schedule, per-course assignment tracking, and study resource organization into a single interface. 

Originally designed as a complex monorepo, **v2 has been simplified into a consolidated Next.js application** that leverages **Supabase** for Backend-as-a-Service (Auth & Database). This architecture allows for rapid development, multi-tenant SaaS capabilities out of the box, and seamless deployment to Vercel.

---

## Simplified Architecture: Next.js + Supabase

### Why this change?
To maximize speed and maintainability, we've moved from a multi-server monorepo to a unified platform:

| Concern | v2 Simplified Architecture | Benefit |
|---|---|---|
| **Frontend** | Next.js (App Router) | Unified SSR/CSR, SEO, and Routing |
| **API** | Next.js API Routes / Server Actions | No separate server, zero CORS issues |
| **Database** | Supabase (PostgreSQL) | Managed, real-time, built-in RLS |
| **Auth** | Supabase Auth (SSR) | Multi-tenant sessions, social login |
| **Styling** | Tailwind CSS v4 + Apple Design System | High performance, premium "Apple-like" feel |
| **RTL / i18n** | i18next + CSS Logical Properties | Hebrew/English support with one codebase |
| **Deployment** | Vercel | One-click, auto-scaling deployment |

### Multi-Tenancy Model: Row Level Security (RLS)

We use Supabase's **Row Level Security (RLS)** to handle multi-tenancy. Every table includes a `tenant_id`.

```sql
-- Every table includes tenant_id
CREATE TABLE courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL DEFAULT auth.uid_metadata()->>'tenant_id',
  name        TEXT NOT NULL,
  ...
);

-- RLS enforces isolation automatically
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON courses
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID);
```

---

## Technical Stack (Finalized)

| Layer | Choice |
|---|---|
| **Framework** | **Next.js 14+** |
| **Database** | **Supabase (PostgreSQL)** |
| **Auth** | **Supabase Auth** |
| **UI** | **Apple-inspired Custom Components** |
| **i18n** | **i18next + react-i18next** |

---

## Updated Milestones

| Milestone | Status |
|---|---|
| M1 — Core + Auth | **Completed** (Next.js + Supabase SSR) |
| M2 — RTL + i18n | **In Progress** (Hebrew locale, Heebo font) |
| M3 — Schedule | **In Progress** (Apple-style Timetable grid) |
| M4 — Assignments | **In Progress** (CRUD with Supabase) |
| M5 — Resources | Planned (File upload to Supabase Storage) |
| M6 — Dashboard | **In Progress** (Stats, Upcoming view) |
| M7-M9 | Planned |
