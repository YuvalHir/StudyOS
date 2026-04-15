# Codebase Structure

**Analysis Date:** 2024-11-20

## Directory Layout

```
studyos/
├── apps/               # Applications
│   ├── api/            # Hono API (Backend)
│   └── web/            # Vite + React (Frontend)
├── packages/           # Shared Workspace Packages
│   ├── db/             # Drizzle ORM schema & migrations
│   ├── storage/        # S3-compatible (R2) storage service
│   └── ui/             # Shared React components & styles
├── .planning/          # GSD planning and analysis docs
├── phases/             # Detailed phase specifications
└── docker-compose.yml  # Local infra (Postgres)
```

## Directory Purposes

**apps/api:**
- Purpose: Backend API service providing endpoints for the web app.
- Contains: Hono application, services, and middlewares.
- Key files: `src/index.ts`, `src/middleware/tenant.ts`, `src/services/auth.ts`.

**apps/web:**
- Purpose: Frontend web application.
- Contains: React components, locales, and Vite configuration.
- Key files: `src/main.tsx`, `src/App.tsx`, `src/i18n.ts`.

**packages/db:**
- Purpose: Centralized database management.
- Contains: Drizzle schema definitions and multi-tenant (RLS-like) helpers.
- Key files: `src/schema.ts`, `src/rls.ts`, `drizzle.config.ts`.

**packages/storage:**
- Purpose: Abstracted file storage.
- Contains: S3-compatible client for R2/AWS storage.
- Key files: `src/storage.ts`.

**packages/ui:**
- Purpose: Design system and shared UI components.
- Contains: React components with co-located CSS.
- Key files: `src/index.ts`, `src/components/Button/Button.tsx`.

## Key File Locations

**Entry Points:**
- `apps/api/src/index.ts`: API entry point.
- `apps/web/src/main.tsx`: Web application entry point.

**Configuration:**
- `package.json`: Root workspace configuration.
- `tsconfig.json`: Root TypeScript configuration.
- `apps/api/.env`: API environment variables (mirrored from root `.env`).

**Core Logic:**
- `packages/db/src/schema.ts`: Database schema (Source of truth for models).
- `apps/api/src/middleware/tenant.ts`: Tenant isolation logic.

**Testing:**
- Not detected. No test files or configurations found in the codebase.

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `Button.tsx`).
- Styles: `PascalCase.css` co-located with components.
- Services/Utilities: `camelCase.ts` (e.g., `auth.ts`).

**Directories:**
- Feature/Component folders: `PascalCase` or `camelCase` depending on context. Components generally use `PascalCase` (e.g., `src/components/Schedule`).

## Where to Add New Code

**New Feature (End-to-End):**
- Primary logic: `apps/api/src/services/` or `packages/storage/`.
- Database changes: `packages/db/src/schema.ts`.
- API Endpoint: `apps/api/src/index.ts`.
- Frontend UI: `apps/web/src/components/`.
- Shared UI: `packages/ui/src/components/`.

**New Component:**
- Create a new directory in `packages/ui/src/components/[ComponentName]/`.
- Include `[ComponentName].tsx` and `[ComponentName].css`.
- Export via `packages/ui/src/index.ts`.

**Utilities:**
- Shared helpers: `packages/ui/src/utils/` (if UI related) or a new package if generic.

## Workspace Dependencies

- `apps/api` depends on `@studyos/db`.
- `apps/web` depends on `@studyos/ui`.
- `packages/db`, `packages/storage`, and `packages/ui` are independent base packages.

---

*Structure analysis: 2024-11-20*
