# 🎓 StudyOS

StudyOS is a modern, academic management platform designed specifically for university students. It centralizes your university life—schedules, assignments, and study resources—into a single, intuitive interface.

Built with a **SaaS-ready, multi-tenant architecture**, StudyOS supports both a public-facing cloud version and a privacy-focused self-hosted option. It features **first-class Hebrew (RTL) support**, making it the ideal companion for students in Israel and beyond.

![StudyOS Preview](https://via.placeholder.com/1200x600?text=StudyOS+Dashboard+Preview)

## ✨ Features

- 📅 **Smart Schedule:** A dynamic timetable grid that automatically organizes your weekly classes.
- 📝 **Assignment Tracker:** Never miss a deadline with per-course assignment tracking, priority levels, and status management.
- 📚 **Resource Library:** Centralize your HTML summaries, PDFs, Word docs, and other study materials in one place.
- 🌍 **Full RTL Support:** Seamless Hebrew and English localization with a layout that adapts perfectly to right-to-left languages.
- 🌓 **Dark & Light Mode:** Optimized for late-night study sessions or bright morning classes.
- 🔒 **Multi-Tenant Security:** Robust row-level isolation ensuring your data remains private and secure.
- 🚀 **Modern UI:** Built with Framer Motion for smooth transitions and a polished, responsive feel.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Localization:** [i18next](https://www.i18next.com/) with `react-i18next`
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend & Infrastructure
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Authentication:** [Supabase Auth](https://supabase.com/auth)
- **API:** [Hono](https://hono.dev/)
- **Storage:** S3-compatible (Cloudflare R2 recommended for production)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YuvalHir/StudyOS.git
   cd StudyOS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the `.env.example` to `.env` and fill in your Supabase credentials.
   ```bash
   cp .env.example .env
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```text
src/
├── app/            # Next.js App Router pages and layouts
├── components/     # Reusable UI components (Dashboard, Schedule, UI atoms)
├── lib/            # Shared logic and constants
├── locales/        # i18n translation files (en.json, he.json)
├── utils/          # Supabase client and server-side utilities
└── i18n.ts         # Internationalization configuration
```

## 🗺️ Roadmap

- [x] **M1:** Core Tenant Model & Supabase Auth
- [x] **M2:** Hebrew RTL & i18n Foundation
- [ ] **M3:** Dynamic Schedule Grid
- [ ] **M4:** Assignments CRUD & Deadlines
- [ ] **M5:** Resource Management with R2 Storage
- [ ] **M8:** SaaS Infrastructure & Billing

## 📄 License

This project is [Private](LICENSE.md) - see the LICENSE file for details.

---

Built with ❤️ for students, by students.
