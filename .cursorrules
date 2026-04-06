# Teechi - AI Math Tutor Platform

## Project Overview

Teechi is a Hebrew-language AI-powered math tutoring platform for Israeli students. Students select a subject and topic, then chat with an AI tutor that provides step-by-step math solutions with LaTeX rendering. The platform supports image uploads (photos of math problems), conversation history, and admin management.

**Live URL:** https://teechi.lovable.app

---

## Tech Stack

- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Styling:** Tailwind CSS v3 with shadcn/ui components
- **Backend:** Supabase (Lovable Cloud) — Auth, PostgreSQL, Edge Functions, Storage
- **AI:** OpenAI GPT-4o via Edge Function (`chat-groq`)
- **Math Rendering:** react-latex-next + KaTeX
- **State Management:** React Query (@tanstack/react-query)
- **Routing:** react-router-dom v6

---

## Project Structure

```
src/
├── pages/
│   ├── Index.tsx          # Main chat interface (student view)
│   ├── Auth.tsx           # Login/signup with school & grade selection
│   ├── Admin.tsx          # Admin panel (prompts, subjects, topics, schools, students)
│   └── NotFound.tsx
├── components/
│   ├── TopicSidebar.tsx   # Subject/topic navigation sidebar
│   ├── StudentSettings.tsx # Student profile settings dialog
│   ├── MathMessage.tsx    # LaTeX math rendering wrapper
│   ├── MathSolutionSteps.tsx # Step-by-step solution display
│   ├── NavLink.tsx        # Navigation link component
│   └── ui/               # shadcn/ui components
├── hooks/
│   ├── useAuth.tsx        # Auth state + admin role check
│   └── use-toast.ts       # Toast notifications
├── integrations/supabase/
│   ├── client.ts          # Auto-generated Supabase client (DO NOT EDIT)
│   └── types.ts           # Auto-generated DB types (DO NOT EDIT)
├── assets/
│   ├── logo-by1.png       # Main logo (auth screen)
│   └── By-icon1.png       # App icon (sidebar, pages)
└── index.css              # Design system tokens (HSL)

supabase/
├── functions/
│   ├── chat-groq/index.ts     # AI chat edge function (OpenAI GPT-4o)
│   └── admin-users/index.ts   # Admin user management edge function
└── config.toml
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `students` | Student profiles (name, grade, school_id, user_id) |
| `schools` | School registry |
| `subjects` | Math subjects |
| `topics` | Topics per subject (filtered by grade & school) |
| `prompts` | System prompts per subject/topic (Hebrew, configurable) |
| `chat_sessions` | Conversation sessions (student_id, subject_id, topic_id) |
| `chat_messages` | Messages within sessions (role: user/assistant) |
| `user_roles` | Role-based access (enum: admin, student) |

### Key Relationships
- `students.user_id` → `auth.users.id` (no FK to auth schema)
- `students.school_id` → `schools.id`
- `topics.subject_id` → `subjects.id`
- `topics.school_id` → `schools.id` (optional, for school-specific topics)
- `prompts` → `subjects`, `topics`, `schools`
- `chat_sessions` → `students`, `subjects`, `topics`
- `chat_messages.session_id` → `chat_sessions.id`

### Security
- RLS enabled on all tables
- `has_role(_user_id, _role)` — SECURITY DEFINER function for role checks
- Admin actions verified server-side in edge functions

---

## Authentication Flow

1. **Signup:** Email + password + student name + grade + school selection
2. **Email verification required** (no auto-confirm)
3. **Login:** Email + password → redirects to `/`
4. **Admin manual email confirmation** available via admin panel
5. **Role check:** `useAuth()` hook checks `user_roles` table for admin status

---

## Key Features

### Chat Interface (`Index.tsx`)
- Subject/topic selection via sidebar
- Real-time AI chat with step-by-step math solutions
- Image attachment support (photos of math problems, max 4MB)
- Drag & drop image upload
- Conversation history per session
- LaTeX rendering for math expressions
- Responsive mobile layout with sheet-based sidebar

### AI Response Format
The AI returns structured step-by-step solutions:
```
###STEP### Step Title
Explanation in Hebrew
LaTeX expression
###QUESTION### Guiding question

###FINAL### Final Answer
Summary explanation
Final LaTeX expression
```

### Admin Panel (`Admin.tsx`)
Tabbed interface with sections:
- **Schools** — CRUD for schools
- **Subjects** — CRUD for subjects
- **Topics** — CRUD for topics (per subject, with grade/school filters)
- **Prompts** — System prompt management (per subject/topic, active/inactive)
- **Students** — User management:
  - View all students with email, grade, school, status
  - Approve/suspend users (ban/unban)
  - Manual email confirmation
  - Promote to admin / remove admin
  - Delete users
  - Search functionality

### Edge Functions
- **`chat-groq`**: Handles AI chat — fetches prompt from DB, builds conversation history, calls OpenAI GPT-4o, returns structured response
- **`admin-users`**: Admin-only user management — list, ban, unban, confirm_email, make_admin, remove_admin, delete

---

## Design System

### Colors (HSL in index.css)
- **Primary:** `197 100% 47.5%` (#00b3f2 — bright blue)
- **Background:** `0 0% 100%` (white)
- **Foreground:** `222.2 84% 4.9%` (near-black)
- Dark mode supported via `.dark` class

### Rules
- **NEVER** use hardcoded colors in components — always use semantic tokens
- Use `bg-primary`, `text-foreground`, `border-border`, etc.
- All custom colors must be added to `tailwind.config.ts` + `index.css`

---

## Important Rules

### DO NOT EDIT (Auto-generated)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

### Conventions
- **Language:** UI is entirely in Hebrew (RTL)
- **Direction:** Components use RTL-aware layouts
- **Imports:** Use `@/` path alias for `src/`
- **Components:** Use shadcn/ui from `@/components/ui/`
- **Database changes:** Always use migrations, never direct SQL
- **Secrets:** Never expose API keys in client code
- **Roles:** Always stored in `user_roles` table, never on profile/users table
- **Edge Functions:** Auto-deployed, CORS headers required

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Anon key (safe for client)
- `OPENAI_API_KEY` — Server-side only (edge functions)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side only (edge functions)

---

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run test       # Run vitest tests
```
