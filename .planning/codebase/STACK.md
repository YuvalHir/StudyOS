# Technical Stack (v2 - Consolidated)

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | **Next.js 14+ (App Router)** | Unified Frontend/API, SSR, SEO, Speed |
| **Database** | **Supabase (PostgreSQL)** | Managed DB, Built-in RLS for Multi-tenancy |
| **Auth** | **Supabase Auth (SSR)** | Multi-tenant session management, Social Login |
| **Storage** | **Supabase Storage** | Easy file management, S3-compatible |
| **Styling** | **Tailwind CSS v4** | Premium "Apple-like" feel, High performance |
| **i18n** | **i18next + react-i18next** | Industry standard for multi-language & RTL |
| **Deployment** | **Vercel** | Optimized for Next.js, Edge-ready |

## Key Libraries
- `@supabase/supabase-js`: Main client SDK.
- `@supabase/ssr`: Next.js Server Side Rendering helpers.
- `i18next`, `react-i18next`: Localization.
- `framer-motion`: (Optional) For smooth Apple-like transitions.
