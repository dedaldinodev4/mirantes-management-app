# Flow — Project Management 

> A project management application built with Next.js, TypeScript, Supabase.

---

## ✨ Features

- **🎨 Premium UI** — Dark-first design inspired by Linear, Vercel Dashboard, and Notion
- **📋 Kanban Board** — Smooth drag-and-drop with @dnd-kit, real-time column reordering
- **🔐 Authentication** — Email/password + Google Sign-In via Supabase
- **🔥 Firestore** — Real-time database with offline persistence
- **🌙 Dark/Light Mode** — Smooth transitions, persisted preference
- **⌨️ Command Palette** — `⌘K` search and navigation (Linear-style)
- **📊 Dashboard** — Metrics, project progress, activity feed
- **✅ Task Management** — Priority, labels, due dates, assignees, comments
- **🔔 Notifications** — Overdue alerts, mentions, activity updates
- **📱 Responsive** — Mobile-first, works on all screen sizes
- **🧪 Tested** — Vitest + React Testing Library, 100% utils coverage

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS + CSS Variables |
| Components | shadcn/ui + Radix UI |
| Animation | Framer Motion |
| Drag & Drop | @dnd-kit/core + sortable |
| State | Zustand (devtools + persist) |
| Forms | React Hook Form + Zod |
| Backend | Supabase |
| Toasts | Sonner |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/flow.git
cd flow
npm install
```

### 2. Configure Supabase

Create a Supabase project at [https://supabase.com/](https://supabase.com/), then:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

### Key Design Decisions

- **Feature-driven architecture** — each feature is self-contained with components, hooks, and schemas
- **Optimistic UI** — store updated immediately on interaction, Firebase synced async
- **No prop drilling** — Zustand stores + custom hooks at feature level
- **Singleton Supabase** — prevents re-initialization in Next.js HMR
- **Strict TypeScript** — no `any`, full type coverage

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:ui

# Coverage
npm run test:coverage
```

Test coverage includes:
- ✅ All utility functions (`cn`, `getInitials`, `calcProgress`, etc.)
- ✅ Auth form schemas (Zod validation)
- ✅ Zustand stores (task CRUD, kanban moves, filters, UI state)
- ✅ UI components (PriorityBadge, Avatar, AvatarGroup)

---

## 📋 Business Rules Implemented

| Rule | Location |
|---|---|
| Only owner can delete project | `services/firebase/projects.ts` → `deleteProject()` |
| Members can edit tasks | Firestore security rules |
| Done tasks require confirmation to revert | `TaskModal` status change handler |
| Overdue tasks highlighted | `isOverdue()` + red left border on `TaskCard` |
| Tasks belong to a project | Required `projectId` in schema + Firestore |
| Project calculates progress automatically | `calcProgress()` in dashboard + project cards |
| Comments store author + timestamp | Firestore `authorId` + `createdAt` fields |
| Invalid dates blocked | Zod schema date validation |

---

## 🚢 Deployment (Vercel)

```bash
# Push to GitHub, then connect to Vercel
# Add environment variables in Vercel dashboard
vercel --prod
```

---
