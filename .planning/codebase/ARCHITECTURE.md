# Project Architecture (Consolidated v2)

## Unified Next.js Platform
The application is a single Next.js project that handles both the Frontend (React Server Components/Client Components) and the Backend logic (Server Actions/Supabase RLS).

### Core Components
1. **Frontend:** Next.js (App Router) + Tailwind CSS / Vanilla CSS for styling.
2. **Auth:** Supabase Auth (SSR) with multi-tenant sessions stored in `user_metadata`.
3. **Database:** Supabase (PostgreSQL) with Row Level Security (RLS) policies for data isolation.
4. **Localization:** i18next for multi-language (Hebrew/English) and CSS Logical Properties for RTL support.

### Data Flow
- **Client-Side:** Supabase Client for real-time updates and simple auth state.
- **Server-Side:** Supabase Server Client for secure SSR and initial session validation.
- **Isolation:** Tenant isolation is enforced at the database level via RLS, ensuring zero cross-tenant data leaks.

### Design System
Apple-inspired UI components (frosted glass, high-quality typography, smooth transitions) implemented as custom local components in `src/components/ui`.
