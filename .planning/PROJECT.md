# Project StudyOS

StudyOS is an academic management web application for university students, centralizing schedules, assignments, and study resources (HTML, PDF, Word).

## Core Value
A single, multi-tenant interface for academic organization that treats Hebrew RTL as a first-class citizen.

## Constraints
- Multi-tenant SaaS architecture (PostgreSQL with RLS)
- Hebrew/RTL support as a primary requirement
- Cloudflare R2 for file storage
- Supabase Auth for sessions
- Support for self-hosting (SQLite option)

## Tech Stack
- Frontend: React + Vite + i18next + Heebo Font
- Backend: Hono + Node.js (with tenant middleware)
- Database: PostgreSQL (with Drizzle ORM)
- Storage: Cloudflare R2 (S3-compatible)
- Auth: Supabase Auth
- Cache: Upstash Redis (for rate limiting)
- Deployment: Docker / Easypanel
