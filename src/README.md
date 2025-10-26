# Personas (developer quick reference)

This file documents where and how the project uses personas and how to update them.

Where personas live
- Database: `public.personas` (Supabase)
- Migration: `supabase/migrations/04_create_personas_table.sql`

Primary code paths
- Server actions: `src/lib/persona-actions.ts` — canonical place to fetch/modify personas.
- Client hook: `src/hooks/use-persona-manager.ts` — React hook used by UI components to fetch and cache personas.
- Constants: `src/lib/constants.ts` — `PersonaIDs` constant used to avoid hard-coded strings.
- Types: `src/types/chat-types.ts` — `validPersonas` and default persona values.
- Chat flow: `src/ai/flows/chat-flow.ts` — resolves persona prompt for AI system messages.
- Key UI components:
  - `src/components/chat/persona-selector.tsx`
  - `src/components/chat/multimodal-input.tsx`
  - `src/components/landing/landing-page-chat-v2.tsx`

How to add a persona (high-level)
1. Create an INSERT migration or add the row via Supabase SQL editor (see `supabase/migrations/04_create_personas_table.sql`).
2. (Optional) Add the id to `src/lib/constants.ts` to make it easy to reference in code.
3. Add the id to `src/types/chat-types.ts` `validPersonas` array to keep TypeScript strict.
4. Test locally: run dev server, select the persona in the UI, and send a chat message.

Best practices
- Prefer adding personas via DB so they can be updated without redeploys.
- Avoid hard-coded string ids across components; use `PersonaIDs` constant.
- If you must rename an id, follow a migration strategy to preserve chat history (create new row, migrate existing references, then remove old row).

Common troubleshooting
- Personas not showing: ensure `getPersonas()` returns rows and `is_active` is true.
- Unexpected persona behavior: inspect `prompt` field in DB for the persona and check `chat-flow` usage.

If you need a longer developer doc, update `docs/PERSONAS.md` (canonical) and link it here.
# FocusFlow AI: Project Overview

This document provides a comprehensive overview of the FocusFlow AI application, detailing its features, technical implementation, design philosophy, and key development challenges.

## 1. Application Vision & UI/UX Philosophy

FocusFlow AI is an intelligent, all-in-one study toolkit designed to be a student's proactive co-pilot. The core vision is to deliver sophisticated AI-powered assistance through a simple, intuitive, and delightful interface.

### UI/UX Goals:
- **Effortless Intelligence:** AI interactions feel natural and predictive, not cumbersome.
- **Intuitive Harmony:** The interface is clean, with ample whitespace, consistent components, and a clear visual hierarchy, ensuring every interaction is intentional.
- **Minimalist Design:** Built with **ShadCN UI** and **Tailwind CSS**, the app features a professional dark theme (`#1B1F23`), a primary blue accent (`#3B82F6`), and refined typography (Satoshi for headings, Inter for body text).
- **Subtle Delight:** Micro-animations using **Framer Motion** are employed for smooth transitions, component reveals (like the Smart Tools menu), and interactive elements to create a satisfying user experience.

---

## 2. Core Features

### a. Conversational AI Chat
The central feature is a dynamic chat interface where users interact with an AI study assistant. It supports text input and file uploads (PDF, images, text) to provide context for conversations.

### b. Integrated Notes Panel
A persistent, side-by-side notepad lives alongside the main chat interface. Users can seamlessly send selected text from an AI's response directly to their notes with a single click, or type freely into the notepad. The content is auto-saved, providing a fluid experience for capturing ideas, drafting outlines, and collecting important information without ever leaving the chat view.

### c. Customizable AI Personas
Users can select from a variety of AI personas (e.g., *Explain Like I'm 5*, *Brutally Honest Mentor*, *Cram Buddy*) to tailor the AI's tone and teaching style to their specific learning needs.

### d. Integrated Study Tools
- **Flashcard & Quiz Generation:** From any AI response or user-provided text, users can instantly generate interactive, flippable flashcards and multiple-choice quizzes directly within the chat interface. These are core, first-class features.
- **Smart Text Utilities:** A context-aware toolbar appears under AI messages, offering tools to `Rewrite Text`, `Convert to Bullets`, `Find Counterarguments`, and `Create a Presentation Outline`.

### e. Prompt Template Library
A rich library of pre-made prompts helps users kickstart complex tasks like creating study plans, proofreading text, or brainstorming essay ideas.

### f. User Dashboard & Gamification
A personalized dashboard tracks user activity and progress.
- **KPIs:** Displays counts of summaries, quizzes, and flashcards created.
- **Progress Tracking:** A chart visualizes weekly study sessions against user-set goals.
- **Gamification:** Features a "Study Streak" counter and unlockable badges to motivate consistent learning.

### g. Authentication & Content Persistence
- **Secure Authentication:** Supports Email/Password authentication via **Supabase Authentication**.
- **Personalized Content:** Logged-in users have their generated summaries, quizzes, flashcard sets, study plans, and notes automatically saved to their personal "My Content" area, powered by **Firestore**.
- **Feature Gating:** The application supports a premium tier. A user's `isPremium` status, stored in their Firestore document, controls access to advanced features and lifts usage limits on core tools.

---

## 3. Technical Implementation & Flow

### a. Technology Stack
- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI, Framer Motion
- **Backend & Database:** Supabase (Authentication, PostgreSQL Database)
- **Deployment:** Cloudflare Pages (Edge Runtime)
- **AI:** Google Gemini API (using `gemini-2.5-flash` model with 65,536 max output tokens)

### b. Core Chat Flow
1.  **User Input:** The user sends a message or selects a tool from the `ChatPage` UI. They can also attach a file (like a PDF), which is converted to a Data URI on the client-side.
2.  **API Route:** A request is made to the `/api/chat` Next.js server route, containing the message, user auth token, and any contextual data (like a file's data URI or a selected persona).
3.  **Chat Flow (`chatFlow`):** The API route invokes the main chat flow function (`src/ai/flows/chat-flow.ts`).
4.  **Usage Check (for Tools):** Before executing a protected tool (like `createQuizTool`), the flow checks the user's `isPremium` status and their monthly usage count in the Supabase database. If a free user exceeds their limit, the flow returns an error.
5.  **AI Processing:** The flow makes a direct API call to Google Gemini 2.0 Flash Lite model. It processes the user's message along with conversation history and persona context, formulating a conversational response or triggering specific AI tools (e.g., `createQuizTool`, `summarizeNotesTool`).
6.  **Structured Output:** Tools are designed to return structured JSON data (e.g., an array of flashcard objects, a quiz object with questions and answers).
7.  **Data Persistence:** If a tool was used, the `chatFlow` saves the generated content to the user's Supabase database tables (e.g., `summaries`, `quizzes`, `flashcards`). The notepad content is saved to the `user_notes` table, with a debounced server action ensuring changes are saved automatically.
8.  **Response to Client:** The flow returns a response object containing the AI's text and any structured data (like the quiz object).
9.  **Frontend Rendering:** The `ChatPage` receives the response. If structured data is present, it renders the corresponding interactive component (`QuizViewer`, `FlashcardViewer`); otherwise, it displays the formatted text response.

---

## 4. Key Development Challenge & Resolution

A significant challenge was ensuring that large file contexts, especially from multi-page PDFs, were reliably processed and understood by the AI model. Simply passing a large Data URI was not enough; it required a robust, end-to-end data handling strategy.

### The Problem:
- **Client-Side Processing:** Reading large files into memory as Data URIs on the client can be slow and memory-intensive, potentially crashing the browser tab.
- **API Payload Limits:** Sending large Data URIs in a JSON payload to the API route risks exceeding server payload size limits.
- **AI Context Window:** The AI model needs to receive the file content in a format it can interpret within its context window, alongside the user's prompt and other instructions.

### The Solution:
A multi-stage solution was implemented to create a robust file processing pipeline:
1.  **Client-Side Validation & Conversion:** The `useFileUpload` hook was refined to include strict checks on file size (e.g., under 10MB) and type (PDF, image, text) before attempting to read the file. It efficiently converts the validated file into a `data:mime/type;base64,...` Data URI.
2.  **Streamlined API Handling:** The Next.js API route at `/api/chat` was configured to handle large request bodies. It receives the entire JSON payload, including the Data URI.
3.  **Direct Gemini API Integration:** The `chatFlow` function makes direct fetch requests to the Gemini API with the conversation context. File content can be included in the request payload for multimodal processing.

This solution ensures that users can seamlessly upload documents, have them processed efficiently, and receive AI-generated insights based on the full context of their materials, which is the cornerstone of the FocusFlow AI experience.
meow
meow 2
mcp
meow 4
meow 5
meow 6
ai tools prob
meow 7 preferences
chat working fine now with preferences
added model chat
meow 8, improved landing page
fixed the sign in issues
meow 9
fixed personas and chat
fixed harcoded persona
simplified onboarding
