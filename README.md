
# FocusFlow AI

FocusFlow AI is an intelligent, all-in-one study toolkit designed to be a student's proactive co-pilot. The core vision is to deliver sophisticated AI-powered assistance through a simple, intuitive, and delightful interface. This document provides a comprehensive overview of the FocusFlow AI application, detailing its features, technical implementation, and design philosophy.

## 1. Application Vision & UI/UX Philosophy

FocusFlow AI is designed to be a student's proactive co-pilot. The core vision is to deliver sophisticated AI-powered assistance through a simple, intuitive, and delightful interface.

### UI/UX Goals:
- **Effortless Intelligence:** AI interactions feel natural and predictive, not cumbersome.
- **Intuitive Harmony:** The interface is clean, with ample whitespace, consistent components, and a clear visual hierarchy, ensuring every interaction is intentional.
- **Minimalist Design:** Built with **ShadCN UI** and **Tailwind CSS**, the app features a professional dark theme, a primary blue accent, and refined typography.
- **Subtle Delight:** Micro-animations using **Framer Motion** are employed for smooth transitions and interactive elements to create a satisfying user experience.

---

## 2. Core Features

### a. Conversational AI Chat
The central feature is a dynamic chat interface where users interact with an AI study assistant. It supports text input and file uploads (PDF, images, text) to provide context for conversations.

### b. Integrated Notes Panel
A persistent, side-by-side notepad lives alongside the main chat interface. Users can seamlessly send selected text from an AI's response directly to their notes with a single click, or type freely into the notepad. The content is auto-saved, providing a fluid experience for capturing ideas and drafting outlines without ever leaving the chat view.

### c. Customizable AI Personas
Users can select from a variety of AI personas (e.g., *Explain Like I'm 5*, *Brutally Honest Mentor*, *Cram Buddy*) to tailor the AI's tone and teaching style to their specific learning needs.

### d. Integrated Study Tools
- **Flashcard & Quiz Generation:** From any AI response or user-provided text, users can instantly generate interactive, flippable flashcards and multiple-choice quizzes directly within the chat interface.
- **Smart Text Utilities:** A context-aware toolbar appears under AI messages, offering tools to `Rewrite Text`, `Convert to Bullets`, `Find Counterarguments`, and `Create a Presentation Outline`.

### e. Prompt Template Library
A rich library of pre-made prompts helps users kickstart complex tasks like creating study plans, proofreading text, or brainstorming essay ideas.

### f. User Dashboard & Gamification
A personalized dashboard tracks user activity and progress.
- **KPIs:** Displays counts of summaries, quizzes, and flashcards created.
- **Progress Tracking:** A chart visualizes weekly study sessions against user-set goals.
- **Gamification:** Features a "Study Streak" counter and unlockable badges to motivate consistent learning.

### g. Authentication & Content Persistence
- **Secure Authentication:** Supports Email/Password authentication via **Supabase**.
- **Personalized Content:** Logged-in users have their generated summaries, quizzes, flashcard sets, study plans, and notes automatically saved to their personal "My Content" area, powered by **Supabase**.
- **Feature Gating:** The application supports a premium tier. A user's `isPremium` status, stored in their Supabase profile, controls access to advanced features and lifts usage limits on core tools.

---
## FocusFlow — Detailed Project Overview

This repository contains FocusFlow: an AI-first study assistant web application built with Next.js + TypeScript. The README below describes the current, up-to-date state of the app (features, architecture, developer setup, and testing/deployment notes). It is written to be used as the basis for a comprehensive project report.

## Table of contents

- Project summary
- Features (detailed)
- Architecture & tech stack
- Data & persistence
- API surfaces and routes
- Developer setup (local) and environment variables
- Testing and verification
- Project structure (key files & folders)
- How to contribute & next steps

---

## Project summary

FocusFlow is an AI-assisted learning workspace designed to help students study more effectively. It centers around a multimodal chat assistant and a suite of study tools (flashcards, quizzes, study plans, practice exams, summaries, notes and content publishing), with tight user-content persistence and premium feature gating.

Key user goals:
- Ask questions and get structured answers from the AI
- Turn AI output or uploaded materials into study artifacts (flashcards/quizzes/summaries)
- Build and follow study plans and practice exams
- Save, manage, and publish content

---

## Features (detailed)

The application contains the following user-facing features (implemented in the current codebase):

- Chat & AI tools
  - Multimodal chat interface (text + file upload) with contextual tools.
  - File upload handlers for chat (PDF, images, text) and server routes for file uploads: `src/app/api/chat/file/route.ts`, `src/app/api/chat/upload/route.ts`.
  - Smart tools that can transform AI responses into structured outputs (flashcards, quizzes, outlines, rewrites). Implementations live in `src/ai/tools.ts` and `src/ai/flows/chat-flow.ts`.
  - Persona support for changing AI tone/behavior; persona APIs exist under `src/app/api/personas` and persona data in `src/lib/personas.ts` and `src/lib/persona-actions.ts`.

- Notes & context hub
  - Persistent note-taking panel integrated with chat. Notes are stored client-side and synced to Supabase via `src/lib/notes-actions.ts` and `src/app/api/notes/route.ts`.
  - Context hub (sidebar) for feeding selected content into the chat: `src/components/chat/context-hub.tsx`.

- Flashcards & Quizzes
  - Generate flashcard sets from AI output and view them via `FlashcardViewer` (`src/components/flashcard-viewer.tsx`) and flashcard pages under `src/app/flashcards`.
  - Create and view quizzes — `QuizViewer` at `src/components/quiz-viewer.tsx` and quiz routes in `src/app/my-content/quizzes`.

- Summaries & My Content
  - Summaries are generated/managed and stored in `src/lib/summaries-data.ts` and exposed in `src/app/my-content/summaries`.
  - A unified "My Content" area houses saved messages, summaries, flashcard sets, quizzes, and study plans, implemented under `src/app/my-content`.

- Study Plans & Practice Exams
  - Create and manage study plans and practice exams. Study plan pages and APIs live under `src/app/study-plan` and `src/lib/study-plan-data-actions.ts`.
  - Practice exams have their own flow and review pages under `src/app/practice-exam`.

- Dashboard, analytics & gamification
  - Personalized dashboard with KPI cards, streak calendar, mastery graphs and goal tracking (`src/components/dashboard/*` and `src/app/dashboard`).

- Prompt & Template Library
  - Prompt library UI and data are available and editable in `src/components/prompt-library.tsx` and `src/lib/prompts-data.ts`.

- Publishing & Public Content
  - Users can publish content as blog posts through `src/components/publish-as-blog-modal.tsx` and public content utilities in `src/lib/public-content-data.ts` and `src/lib/blog-posts-data.ts`.

- Authentication & onboarding
  - Supabase-based auth flows, onboarding modal and username capture are implemented in `src/components/auth` and `src/context/auth-context.tsx`.
  - Onboarding UX lives in `src/components/onboarding/onboarding-modal.tsx`.

- Misc utilities & UX
  - File upload hooks `src/hooks/use-file-upload.ts`.
  - Auto-resize textareas, mobile recognition hooks, toast UI, personalized persona manager hooks and many other polished UI helpers across `src/hooks` and `src/components/ui`.

- Premium gating
  - Premium pages and gating are implemented (`src/app/premium/page.tsx`) and controlled by profile flags stored via Supabase (`src/lib/profile-actions.ts`).

---

## Architecture & tech stack

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui patterns, Framer Motion.
- State management: `zustand` and React context providers (`src/context`).
- Backend & persistence: Supabase (auth + PostgreSQL) — `src/lib/supabase.ts` wraps client usage.
- AI stack: Google Gemini (`@google/genai`) used directly (`src/lib/gemini-client.ts`) and combined with LangChain where applicable (`langchain` present in package.json). AI flows live in `src/ai/flows`.
- Testing: Vitest for unit tests; Playwright is available for end-to-end tests.
- Utilities: PDF parsing (`pdf-parse`), file attachment helpers, and a number of UI libraries (Radix UI, tiptap editor, Recharts for charts).

Dependencies (high-level): refer to `package.json` for precise versions (Next, React, @google/genai, supabase-js, langchain, tailwindcss, vitest, playwright).

---

## Data model & persistence notes

- User profiles and auth: stored in Supabase auth + `profiles` table (profile-related actions in `src/lib/profile-actions.ts`).
- Content (summaries, flashcards, quizzes, study plans) is persisted to Supabase and surfaced in `src/app/my-content/*`.
- Chat history: persisted per user with API routes under `src/app/api/chat/*`.

If you need the exact table schema, check migrations in the `supabase/migrations` folder or the Supabase project referenced by environment variables.

---

## API surfaces & important routes

Notable Next.js API routes in `src/app/api`:

- `api/chat/*` — chat session, message create/delete, file upload, stats and session handling (`src/app/api/chat/*`).
- `api/notes/route.ts` — notes persistence.
- `api/personas/*` — listing and selecting personas.
- `api/auth/logout/route.ts` — logout endpoint.

There are also debug and test routes included (e.g., `src/app/api/debug/route.ts`, test files for chat routes).

---

## Developer setup — local

Prerequisites

- Node.js v18+ (project's package.json targets modern Node)
- npm

Install dependencies

```powershell
npm install
```

Environment variables

Create a `.env.local` in the repo root with at least the following values (this project uses Supabase and an AI key):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_genai_key_or_service_credentials
```

Start dev server

```powershell
npm run dev
```

Open http://localhost:3000

Notes: some features integrate with external services (Supabase, Google Gemini). Provide valid credentials for a full experience.

---

## Tests & verification

- Unit tests: `npm run test` (Vitest)
- Interactive test UI: `npm run test:ui` (Vitest UI)
- Typecheck: `npm run typecheck`

Important: running tests or typechecking requires dependencies installed (`npm install`). The repo contains tests for AI tools and chat flows (`src/ai/tools.test.ts`, `src/ai/flows/chat-flow.test.ts`) and API route tests.

Because this change only updates documentation, automated checks were not executed here. If you want me to run typecheck or unit tests in this environment, I can run them next (note: may require >500MB network downloads for node_modules).

---

## Project structure — key files & folders

- `src/app` — Next.js app routes and pages. Notable pages: `chat`, `dashboard`, `my-content`, `flashcards`, `quizzes`, `study-plan`, `practice-exam`, `premium`, `about`, `contact`, `privacy`, `terms`.
- `src/components` — UI components, including `chat` subcomponents (message-list, chat-sidebar, notes tab), `dashboard` widgets, `flashcard-viewer`, `exam-viewer`, `quiz-viewer`, prompt library, onboarding modal, and many reusable UI controls under `components/ui`.
- `src/ai` — AI tools and flows; `tools.ts` and flows under `ai/flows` are the core of the AI orchestration.
- `src/lib` — helpers and actions: `chat-actions.ts`, `ai-actions.ts`, `summaries-data.ts`, `study-plan-data-actions.ts`, `gemini-client.ts`, `supabase.ts`, `personas.ts`, `persona-actions.ts`, `profile-actions.ts`.
- `src/hooks` — custom hooks (`use-file-upload`, `use-chat-history`, `use-auto-resize-textarea`, `use-auth-modal`, `use-persona-manager`, `use-toast`).
- `src/context` — `auth-context.tsx`, `chat-context.tsx` and `providers.tsx`.

---

## How to contribute

1. Fork the repository and create a feature branch from `master`.
2. Follow the existing code style (TypeScript, React/Next.js, Tailwind utilities). Keep changes minimal and focused per PR.
3. Add unit tests for new logic (Vitest) and run `npm run typecheck`.
4. Open a PR with a clear description and link to any relevant issue.

Developer tips:
- When editing AI flows, prefer adding tests under `src/ai/*` to document expected tool outputs.
- Use story-like manual flows for UI changes and consider Playwright for end-to-end tests.

---

## Next steps / recommendations (for the project report)

- Include a high-level architecture diagram showing Next.js frontend -> API routes -> Supabase -> Gemini flow.
- Document DB schemas used in Supabase (profiles, summaries, flashcards, quizzes, study_plans, chat_sessions).
- Export a list of all API endpoints (the `src/app/api` folder is the source of truth).
- Add a privacy/security section documenting where user data is stored and how API keys should be managed in production.

---

If you'd like, I can now:

1. Run `npm run typecheck` and `npm run test` locally and report results (requires `npm install`).
2. Produce a condensed PDF / markdown report derived from this README with tables of routes, components, and a changelog.

Tell me which next step you prefer and I will proceed.
