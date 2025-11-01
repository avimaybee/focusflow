# FocusFlow AI: Comprehensive Master Documentation

**Last Updated:** November 1, 2025  
**Current Branch:** `fixingbackend` (performance optimization & bug fixes)

> **Recent Updates (Nov 1, 2025):** Chat performance significantly improved - eliminated 5-7x redundant fetches per message. See [Chat Performance Optimization](#chat-performance-optimization-nov-2025) section below. All changes tested and verified in fixingbackend branch before merging to main.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Application Vision & Design Philosophy](#application-vision--design-philosophy)
3. [Core Features](#core-features)
4. [Technical Architecture](#technical-architecture)
5. [AI Personas System](#ai-personas-system)
6. [API & Backend Implementation](#api--backend-implementation)
7. [Chat Flow & Core Logic](#chat-flow--core-logic)
8. [Rate Limiting & Performance](#rate-limiting--performance)
9. [Recent Fixes: Chat Performance Optimization](#chat-performance-optimization-nov-2025)
10. [Database Schema](#database-schema)
11. [Authentication & User Management](#authentication--user-management)
12. [Development Checklist](#development-checklist)
13. [Troubleshooting & Known Issues](#troubleshooting--known-issues)
14. [Future Roadmap](#future-roadmap)

---

## Project Overview

### Executive Summary

**FocusFlow AI** is a modern, full-stack web application designed as an intelligent "co-pilot" for students. It fundamentally solves the problem of academic overload and disorganization by replacing fragmented study tools with a unified, conversational interface.

**Core Aim:** To build a highly scalable, polished, and intuitive AI-powered platform that seamlessly integrates note processing, study planning, and progress tracking, transforming the user experience into a delightful, fluid collaboration with an intelligent assistant.

**Core Vision:** To achieve **Effortless Intelligence** and **Intuitive Harmony** in design, where every interaction reinforces the user's sense of clarity, control, and mastery over their academic tasks.

### Key Statistics

- **Primary Model:** Google Gemini 2.5 Flash
- **Maximum Output Tokens:** 65,536
- **Rate Limit:** 10 requests per minute (with exponential backoff retry)
- **Supported File Formats:** PDF, PNG, JPG, GIF, WEBP
- **Max File Size:** 20MB per upload
- **Free Tier Limits:** 5 summaries, 5 quizzes, 1 study plan per month
- **Premium Features:** Unlimited usage, Google Calendar Sync, custom templates

---

## Application Vision & Design Philosophy

### UI/UX Goals

- **Effortless Intelligence:** AI interactions feel natural and predictive, not cumbersome
- **Intuitive Harmony:** Clean interface with ample whitespace, consistent components, clear visual hierarchy
- **Minimalist Design:** Professional dark theme with careful use of color accents
- **Subtle Delight:** Micro-animations using Framer Motion for smooth transitions and interactive polish

### Design System

#### Color Palette

| Color | Value | Usage |
|-------|-------|-------|
| Primary Dark | `#1B1F23` | Background (dark theme) |
| Primary Blue | `#3B82F6` | Information, active states, secondary actions |
| Primary Purple | `#B788E6` | Premium status, primary CTAs (Send, Go Premium) |
| Accent Green | `#10B981` | Success states, positive feedback |
| Accent Red | `#EF4444` | Error states, warnings |
| Neutral Gray | `#9CA3AF` | Secondary text, borders |

#### Typography

- **Headers:** Satoshi (Bold, SemiBold)
- **Body Text:** Inter (Regular, Medium)
- **Monospace:** Fira Code (for code blocks)

#### Spacing System

Based on 8px increments: `8px, 16px, 24px, 32px, 40px, 48px, 56px, 64px`

#### Border Radius

- Small: `4px` (buttons, small badges)
- Medium: `8px` (input fields, cards)
- Large: `12px` (modals, primary containers)
- Extra Large: `16px` (chat bubbles)

### Micro-interactions

All motion should be purposeful and support clarity, not distraction:

- **Message Entry:** Slide-up and slight fade animation (200ms)
- **AI Response:** Smooth typing effect with character-by-character reveal
- **Menu/Modal Open:** Gentle slide-in/fade (150ms)
- **Button Hover:** Subtle color shift (50ms transition)
- **Component Reveal:** Fade-in with stagger for lists (100-150ms per item)

---

## Core Features

### 1. Conversational AI Chat

**Description:** The central feature is a dynamic chat interface where users interact with an AI study assistant with full conversation history and context awareness.

**Key Capabilities:**
- Text-based conversations with full history
- File uploads: PDF, images, text documents
- Persona-based tone selection
- Context window management (maintains conversation history)
- Real-time typing indicators

**UI Components:**
- `src/components/chat/chat-page.tsx` - Main chat interface
- `src/components/chat/multimodal-input.tsx` - File upload & message input
- `src/components/chat/message-bubble.tsx` - Message rendering
- `src/components/chat/persona-selector.tsx` - Persona selection

### 2. Integrated Notes Panel

**Description:** A persistent, side-by-side notepad lives alongside the main chat interface.

**Key Features:**
- Auto-save functionality (debounced)
- Send selected text from AI response directly to notes
- Free-form typing
- Search within notes
- Tagging system
- Note organization by date

**Implementation:**
- `src/components/chat/notes-panel.tsx` - Notepad UI
- `src/lib/note-actions.ts` - Server actions for persistence
- Supabase table: `notes`
- Debounced save (500ms delay)

### 3. Customizable AI Personas

**Description:** Users select from a variety of AI personas to tailor the AI's tone and teaching style.

**Available Personas:**

| ID | Display Name | Human Name | Description |
|----|--------------|-----------|-------------|
| Gurt | Gurt - The Guide | Gurt | Friendly default guide; versatile conversational assistant |
| Im a baby | ELI5 - The Simplifier | Milo | Explains concepts simply, like you're 5 |
| straight shooter | The Direct Answer | Frank | Concise no-nonsense answers |
| essay writer | The Academic Wordsmith | Clairo | Academic, structured writing (600-word default) |
| lore master | The Understanding Builder | Syd | Thorough explanations designed for retention |
| sassy tutor | The Fun Diva Teacher | Lexi | Energetic, Gen Z style, emoji-forward teaching |
| idea cook | The Creative Catalyst | The Chef | Generates multiple creative ideas |
| memory coach | The Speed Learner | Remi | Mnemonics, memory palace, rapid memorization |
| code nerd | The Programming Mentor | Dex | Programming mentor; always uses code blocks |
| exam strategist | The Exam Strategist | Theo | Exam strategies, time management, stress reduction |

**Storage:**
- Supabase table: `personas`
- Server actions: `src/lib/persona-actions.ts`
- Client hook: `src/hooks/use-persona-manager.ts`
- Constants: `src/lib/constants.ts` (PersonaIDs)

### 4. Integrated Study Tools

#### Flashcard Generator

**Triggered By:**
- Prompt template: "Generate Flashcards"
- Smart tool button under AI response
- Chat command with selected text

**Output:**
- Flippable card viewer embedded in chat
- JSON structure with Q&A pairs
- Persistence to Supabase `flashcards` table
- Tags and metadata

**UI Component:**
- `src/components/flashcard-viewer.tsx`

#### Quiz Generator

**Triggered By:**
- Prompt template: "Create a Quiz"
- Smart tool button under AI response
- Direct prompt in chat

**Output:**
- Interactive multiple-choice quiz interface
- Immediate feedback on answers
- Final score summary
- Persistence to Supabase `quizzes` table

**UI Component:**
- `src/components/exam-viewer.tsx`

#### Smart Text Utilities

**Available Tools (context-aware toolbar):**
- **Rewrite Text:** Regenerate content in different style
- **Convert to Bullets:** Create bullet-point summary
- **Find Counterarguments:** Generate opposing viewpoints
- **Create Presentation Outline:** Structure content for presentation

**Implementation:**
- Toolbar appears below AI messages
- Each tool triggers a dedicated Genkit Tool
- Output rendered in new chat bubble

### 5. Prompt Template Library

**Description:** Pre-made prompts help users kickstart complex tasks.

**Template Categories:**
- Study Planning
- Note Summarization
- Quiz Generation
- Essay Writing
- Exam Preparation
- Concept Clarification

**Implementation:**
- `src/lib/prompts-data.ts` - Template definitions
- Modal accessed via + button in input bar
- Templates auto-populate input field on click

**File Storage:**
- `src/lib/prompts-data.ts` - All template definitions

### 6. User Dashboard & Gamification

**Features:**

#### KPI Cards
- Count of summaries created
- Count of quizzes created
- Count of flashcard sets created
- Study sessions logged

#### Progress Tracker
- Visual bar chart: Goal vs. Logged hours
- Weekly view
- Set custom study goals
- Real-time updates

#### Gamification
- **Study Streak:** Counter for consecutive study days (with flame icon)
- **Badges:** Unlockable achievement badges based on thresholds
- **Celebratory Animations:** Framer Motion on badge unlock

**Implementation:**
- Route: `/dashboard`
- Server actions: `src/lib/dashboard-actions.ts`
- Component: `src/components/dashboard/dashboard.tsx`
- Chart library: Recharts
- Supabase tables: `study_sessions`, `goals`, `badges_earned`

### 7. Authentication & Content Persistence

#### Secure Authentication
- Email/Password via Supabase Auth
- JWT tokens stored in secure HTTP-only cookies
- Server-side validation for all API routes

#### Personalized Content
Logged-in users have their generated content auto-saved:
- Summaries
- Quizzes
- Flashcard sets
- Study plans
- Notes

#### Feature Gating
- `isPremium` flag on user profile
- Usage tracking per user per month
- Automatic limit enforcement

---

## Technical Architecture

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend Framework | Next.js (App Router) | Performance, SEO, Server Components/Actions |
| Language | TypeScript | Type safety, catch errors early |
| Styling | Tailwind CSS + ShadCN UI | Rapid development, consistency |
| Motion | Framer Motion | Smooth animations and micro-interactions |
| Hosting | Cloudflare Pages | Global CDN, zero-cost infrastructure |
| Backend Compute | Cloudflare Workers (optional) | Serverless edge compute |
| Database | Supabase (PostgreSQL) | Managed, scalable, excellent DX |
| Authentication | Supabase Auth | Built-in, secure, JWT-based |
| File Storage | Supabase Storage | S3-compatible, integrated |
| AI Model | Google Gemini 2.5 Flash | Latest, cost-effective, 65k output tokens |
| Payment Gateway | Stripe (future) | Freemium monetization |

### Project Structure

```
focusflow/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes
│   │   ├── chat/              # Chat page
│   │   ├── dashboard/         # Dashboard page
│   │   ├── auth/              # Authentication pages
│   │   └── layout.tsx         # Root layout
│   ├── ai/
│   │   ├── flows/
│   │   │   └── chat-flow.ts   # Main chat processing logic
│   │   └── tools.ts           # Genkit tools definitions
│   ├── components/            # Reusable React components
│   │   ├── chat/              # Chat-specific components
│   │   ├── dashboard/         # Dashboard components
│   │   └── shared/            # Shared UI components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   │   ├── gemini-client.ts   # Gemini API client with rate limiting
│   │   ├── persona-actions.ts # Persona server actions
│   │   ├── chat-actions.ts    # Chat server actions
│   │   └── prompts-data.ts    # Prompt templates
│   ├── stores/                # Zustand stores (state management)
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Next.js middleware (auth checks)
├── supabase/
│   ├── migrations/            # SQL migrations
│   └── types/                 # Supabase generated types
├── docs/                      # Documentation
├── public/                    # Static assets
├── .env.example              # Environment template
├── tailwind.config.ts        # Tailwind CSS config
├── tsconfig.json             # TypeScript config
└── package.json              # Dependencies & scripts
```

### Environment Variables

**Required:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI
GEMINI_API_KEY=your-gemini-key

# Deployment
NEXT_PUBLIC_SITE_URL=https://focusflow.com
```

**Optional:**
```env
# Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# Stripe (future)
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-pk
```

---

## AI Personas System

### Overview

FocusFlow stores AI personas in a Supabase `personas` table and exposes them through server actions. The system allows updating personas without code redeploys.

### Database Schema

```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  avatar_emoji TEXT,
  personality_traits TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Files of Interest

| File | Purpose |
|------|---------|
| `supabase/migrations/04_create_personas_table.sql` | Migration that creates the personas table |
| `src/lib/persona-actions.ts` | Server actions (getPersonas, getPersonaById, etc.) |
| `src/hooks/use-persona-manager.ts` | Client hook for fetching and caching personas |
| `src/lib/constants.ts` | PersonaIDs constant for avoiding hard-coded strings |
| `src/types/chat-types.ts` | validPersonas list and persona-related types |
| `src/components/chat/persona-selector.tsx` | Visual persona selector UI |

### How to Add or Update a Persona

#### Method 1: Database Directly (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Insert or update persona row:

```sql
INSERT INTO personas (id, name, display_name, description, prompt, avatar_emoji, personality_traits, is_active, sort_order)
VALUES (
  'your-persona-id',
  'Your Persona Name',
  'Display Name - Subtitle',
  'Short one-sentence description',
  'You are Your Persona Name. Your personality is [traits]. When responding, you [specific instructions]. Always [guidelines].',
  '🎯',
  ARRAY['trait1', 'trait2', 'trait3'],
  true,
  10
);
```

3. Test in chat by selecting the new persona

#### Method 2: Via Migration

1. Create new migration file in `supabase/migrations/`
2. Add INSERT or UPDATE statement
3. Push migrations: `npx supabase db push`

### Important Migration Notes

**Changing persona primary keys is breaking** — always migrate existing chat/preference references:

1. Create new persona row with new id
2. Write data migration updating chat rows to new id
3. Update preferences to new id atomically
4. Deprecate old persona after validation

### Persona Selection Flow

1. **Client:** User clicks persona selector in chat UI
2. **Hook:** `use-persona-manager.ts` fetches personas from server action
3. **Server:** `persona-actions.ts` queries Supabase `personas` table
4. **Storage:** Selected persona ID stored in chat state (Zustand)
5. **Chat Flow:** Selected persona's prompt injected into Gemini system message

---

## API & Backend Implementation

### API Routes

#### POST /api/chat

**Purpose:** Main chat endpoint for processing user messages and AI responses

**Request Body:**
```typescript
{
  message: string;              // User message
  personaId: string;            // Selected persona ID
  sessionId: string;            // Current chat session ID
  fileDataUri?: string;         // Optional file data URI
  fileType?: string;            // File type (pdf, image, etc.)
}
```

**Response:**
```typescript
{
  success: boolean;
  content: string;              // AI response text
  toolData?: {                  // Optional structured data
    type: 'quiz' | 'flashcard' | 'summary' | 'plan';
    data: any;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

**Implementation:**
- `src/app/api/chat/route.ts`
- Calls `src/ai/flows/chat-flow.ts`
- Handles rate limiting and retries

#### GET /api/personas

**Purpose:** Fetch all active personas

**Query Parameters:**
- `active` (optional): Filter by active status (default: true)

**Response:**
```typescript
{
  personas: Persona[];
}
```

**Implementation:**
- `src/app/api/personas/route.ts`
- Caches results for 5 minutes

#### POST /api/save-content

**Purpose:** Save generated flashcards, quizzes, summaries, etc.

**Request Body:**
```typescript
{
  type: 'flashcard' | 'quiz' | 'summary' | 'plan';
  content: any;
  chatSessionId: string;
  tags?: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  contentId: string;
  savedAt: timestamp;
}
```

---

## Chat Flow & Core Logic

### Chat Flow Overview

**File:** `src/ai/flows/chat-flow.ts`

The main chat processing logic orchestrates the entire conversation:

```
User Message
    ↓
Fetch Conversation History
    ↓
Select Persona System Prompt
    ↓
Check Usage Limits (if tool)
    ↓
Call Gemini with Context
    ↓
Parse Response
    ↓
Determine Tool Usage (if any)
    ↓
Execute Tool (save data, generate content)
    ↓
Return Response + Structured Data
    ↓
Render on Client
```

### Step-by-Step Flow

1. **Fetch History:** Query Supabase `chat_messages` table for conversation history
2. **Select Persona:** Get persona prompt from Supabase by ID
3. **Check Limits:** For premium features, verify free user hasn't exceeded monthly limit
4. **Prepare Prompt:**
   ```
   System: [Persona Prompt]
   
   History:
   User: [Previous message 1]
   Assistant: [Previous response 1]
   ...
   
   User: [Current message]
   ```
5. **Call Gemini:** Send to `gemini-2.5-flash` model with file context if present
6. **Parse Output:** Extract text and check for tool invocation markers
7. **Execute Tool:** If tool detected (e.g., quiz generation):
   - Generate structured content
   - Save to Supabase table
   - Return with data
8. **Save Message:** Store user message and assistant response in `chat_messages` table
9. **Return Response:** Send to client for rendering

### Error Handling

| Error | Handling |
|-------|----------|
| 429 Rate Limit | Exponential backoff retry (3 attempts) |
| 500 Server Error | Retry with 2-second backoff |
| Auth Error | Return 401, redirect to login |
| Quota Exceeded | Return user-friendly message about limits |
| File Size > 20MB | Return 413 error to client |

---

## Rate Limiting & Performance

### Rate Limiting System

**Implemented in:** `src/lib/gemini-client.ts`

#### Constraints

- **Max Requests:** 10 per minute
- **Min Delay:** 1 second between requests
- **Sliding Window:** 60-second rolling window
- **Retry Strategy:** Exponential backoff with max 30 seconds

#### How It Works

```typescript
const RATE_LIMIT = {
  maxRequests: 10,          // 10 RPM
  windowMs: 60000,          // 1 minute
  minDelayMs: 1000,         // 1 second min delay
};

// Track all requests in sliding window
requestTimestamps: number[] = [];

async function waitForRateLimit(retryCount = 0) {
  // Remove old timestamps outside window
  requestTimestamps = requestTimestamps.filter(
    ts => Date.now() - ts < 60000
  );
  
  // If at limit, wait for oldest to expire
  if (requestTimestamps.length >= maxRequests) {
    const oldestTs = requestTimestamps[0];
    const waitTime = 60000 - (Date.now() - oldestTs);
    await sleep(waitTime);
  }
  
  // Enforce min delay between requests
  const lastRequest = requestTimestamps[requestTimestamps.length - 1];
  if (lastRequest) {
    const timeSinceLastRequest = Date.now() - lastRequest;
    if (timeSinceLastRequest < 1000) {
      await sleep(1000 - timeSinceLastRequest);
    }
  }
  
  // Exponential backoff for retries
  if (retryCount > 0) {
    const baseDelay = Math.pow(2, retryCount - 1) * 1000;
    const delay = Math.min(baseDelay, 30000);
    await sleep(delay);
  }
  
  // Track this request
  requestTimestamps.push(Date.now());
}

// Retry wrapper
async function retryWithBackoff(fn, maxRetries = 3) {
  try {
    await waitForRateLimit();
    return await fn();
  } catch (error) {
    if (is429Error(error) && retriesLeft > 0) {
      return retryWithBackoff(fn, retriesLeft - 1);
    }
    throw error;
  }
}
```

#### Usage Pattern

```typescript
// Wrap all Gemini API calls
const response = await retryWithBackoff(async () => {
  return await gemini.sendMessage(userMessage);
}, maxRetries);
```

### Performance Optimization

#### Frontend

- **Message Virtualization:** Only render visible messages (large conversations)
- **Image Lazy Loading:** Load file attachments only when needed
- **Code Splitting:** Route-based splitting for faster initial load

#### Backend

- **Caching:**
  - Personas cached for 5 minutes
  - User profiles cached for 2 minutes
- **Database Indexing:**
  - `chat_messages(user_id, session_id)` for fast history lookup
  - `personas(is_active)` for quick persona filtering
- **Streaming:** Large AI responses streamed to client for better UX

---

## Database Schema

### Core Tables

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### personas

```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  avatar_emoji TEXT,
  personality_traits TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### chat_sessions

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  default_persona_id TEXT REFERENCES personas(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP
);
```

#### chat_messages

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  file_attachment_url TEXT,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### flashcards

```sql
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cards JSONB NOT NULL,  -- Array of {question, answer, tags}
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### quizzes

```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,  -- Array of {question, options, correct_answer}
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### notes

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### study_sessions

```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_studied DECIMAL(5, 2) NOT NULL,
  subject TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### goals

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_hours DECIMAL(5, 2) NOT NULL,
  deadline DATE,
  subjects TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### usage_limits

```sql
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,  -- e.g., "2025-11"
  flashcards_created INT DEFAULT 0,
  quizzes_created INT DEFAULT 0,
  summaries_created INT DEFAULT 0,
  study_plans_created INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);
```

---

## Authentication & User Management

### Supabase Authentication

#### Setup

1. **Install Dependencies:**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

2. **Environment Variables:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Initialize Client:**
   ```typescript
   // lib/supabase-client.ts
   import { createClient } from '@supabase/supabase-js';
   
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

#### Authentication Flow

1. **Sign Up:**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123',
   });
   ```

2. **Sign In:**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password123',
   });
   ```

3. **Get Current User:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   ```

4. **Sign Out:**
   ```typescript
   await supabase.auth.signOut();
   ```

#### Server-Side Authentication

Use `src/middleware.ts` to protect routes:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect unauthenticated users to login
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

### User Profile Management

#### Server Actions for User Management

```typescript
// src/lib/user-actions.ts

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function checkPremiumStatus(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('is_premium, premium_expires_at')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  
  const isPremium = data?.is_premium && 
    new Date(data.premium_expires_at) > new Date();
  
  return isPremium;
}
```

#### Usage Limit Tracking

```typescript
// src/lib/usage-actions.ts

export async function checkUsageLimit(
  userId: string,
  feature: 'flashcards' | 'quizzes' | 'summaries' | 'study_plans'
) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data, error } = await supabase
    .from('usage_limits')
    .select(feature)
    .eq('user_id', userId)
    .eq('month_year', month)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  const usage = data?.[feature] || 0;
  const limit = 5; // Free tier
  
  return { usage, limit, canUse: usage < limit };
}

export async function incrementUsage(
  userId: string,
  feature: string
) {
  const month = new Date().toISOString().slice(0, 7);
  
  // Upsert usage limit record
  const { error } = await supabase
    .from('usage_limits')
    .upsert({
      user_id: userId,
      month_year: month,
      [feature]: supabase.sql`COALESCE(${feature}, 0) + 1`,
    }, {
      onConflict: 'user_id,month_year'
    });
  
  if (error) throw error;
}
```

---

## Development Checklist

### Getting Started

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase credentials
- [ ] Fill in Gemini API key
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`

### First Contribution

- [ ] Create feature branch from `develop`
- [ ] Implement feature with TypeScript types
- [ ] Add tests (if applicable)
- [ ] Test rate limiting with rapid messages
- [ ] Verify database queries with Supabase logs
- [ ] Test on mobile viewport
- [ ] Create pull request with description
- [ ] Request review

### Before Deployment

- [ ] Run `npm run build` — verify no build errors
- [ ] Run `npm run lint` — fix any linting issues
- [ ] Test all chat features in production build
- [ ] Verify environment variables are set
- [ ] Check database migrations are up-to-date
- [ ] Clear Supabase storage if needed
- [ ] Update CHANGELOG.md

### Adding a New Feature

1. **Define Types:**
   ```typescript
   // src/types/new-feature.ts
   export interface NewFeature {
     id: string;
     userId: string;
     // ... properties
   }
   ```

2. **Create Database Migration:**
   ```sql
   -- supabase/migrations/XX_add_new_feature.sql
   CREATE TABLE new_features (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     -- ... columns
   );
   ```

3. **Create Server Actions:**
   ```typescript
   // src/lib/new-feature-actions.ts
   export async function getNewFeature(id: string) {
     // Implementation
   }
   ```

4. **Create Component:**
   ```typescript
   // src/components/new-feature.tsx
   'use client';
   
   export function NewFeatureComponent() {
     // Implementation
   }
   ```

5. **Add Route (if applicable):**
   ```typescript
   // src/app/new-feature/page.tsx
   export default function NewFeaturePage() {
     return <NewFeatureComponent />;
   }
   ```

---

## Chat Performance Optimization (Nov 2025)

### Multiple Fetch Issue - Root Cause Analysis & Fix

**Status:** ✅ Fixed in `fixingbackend` branch  
**Issue:** Chat page was making 5-7 API calls per message instead of 1-2, causing visual flicker, jank, and 3+ second stabilization time

#### Root Causes Identified

1. **`session?.access_token` in Dependency Array (CRITICAL)**
   - Object reference changed every render → callback recreated infinitely
   - Fixed: Use `useRef` to keep session stable
   - File: `src/app/chat/page.tsx` lines 233-237

2. **Redundant `loadMessages()` Call After Every Message (CRITICAL)**
   - After sending message, code called both `forceRefresh()` AND `loadMessages()` → double state updates
   - Fixed: Removed explicit `loadMessages()` call (message already in state)
   - File: `src/app/chat/page.tsx` line ~544

3. **Aggressive Retry Logic (HIGH)**
   - Retried 5 times even when data already fetched
   - Fixed: Limited to 2 attempts with smarter condition
   - File: `src/app/chat/page.tsx` line 183

4. **`MessageList` Not Memoized (HIGH)**
   - Parent re-renders caused 240+ child re-renders
   - Fixed: Wrapped with `React.memo()` with custom comparator
   - File: `src/components/chat/message-list.tsx`

5. **`MultimodalInput` Not Memoized (HIGH)**
   - Textarea/persona selector re-rendered on every parent update
   - Fixed: Wrapped with `React.memo()` with smart comparator
   - File: `src/components/chat/multimodal-input.tsx`

#### Implementation Summary

| File | Changes | Impact |
|------|---------|--------|
| `src/app/chat/page.tsx` | Add sessionRef, fix deps, remove loadMessages call, fix retry logic | Stops infinite loop & cascading |
| `src/components/chat/message-list.tsx` | Wrap with memo(), useCallback on handleToolAction | Prevents 240+ child re-renders |
| `src/components/chat/multimodal-input.tsx` | Wrap with memo(), smart comparator | Prevents textarea/selector flicker |

#### Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API calls per message | 5-7 | 1-2 | 86% ⬇️ |
| Component re-renders | 240+ | 2-3 | 99% ⬇️ |
| Stabilization time | 3+ sec | ~400ms | 88% ⚡ |
| Visual flicker | Yes | No | ✅ Fixed |

#### Testing Notes

- Build: ✅ Successful
- TypeScript: ✅ No errors in modified files
- Console logs: ✅ No more retry spam
- Network tab: ✅ Only 1-2 API calls per message

---

## Troubleshooting & Known Issues

### Common Issues

#### Issue: "429 Too Many Requests" Error

**Symptoms:**
- Chat stops responding after several messages
- Error message mentions "rate limited" or "model overloaded"

**Root Cause:**
Hitting Gemini API's 10 requests per minute limit

**Solution:**
- Built-in exponential backoff will retry automatically
- Wait 30 seconds before sending more messages
- Check `src/lib/gemini-client.ts` rate limit configuration

#### Issue: File Upload Fails

**Symptoms:**
- File doesn't attach to message
- Upload button unresponsive

**Possible Causes:**
1. File size > 20MB
2. Unsupported file format (only PDF, PNG, JPG, GIF, WEBP)
3. Network timeout

**Solution:**
- Compress file or split into smaller files
- Use supported formats only
- Check browser network tab for failed requests

#### Issue: Chat History Not Loading

**Symptoms:**
- Previous messages don't appear
- Always start with empty conversation

**Root Cause:**
Database query timeout or Supabase connection issue

**Solution:**
```typescript
// src/app/chat/page.tsx
// Add error boundary and logging
useEffect(() => {
  loadChatHistory().catch(error => {
    console.error('Failed to load history:', error);
    // Show error message to user
  });
}, [sessionId]);
```

#### Issue: Personas Not Appearing

**Symptoms:**
- Persona selector shows empty list
- Default persona always selected

**Root Cause:**
Personas table not populated or server action not called

**Solution:**
```typescript
// Verify personas exist in Supabase
SELECT * FROM personas WHERE is_active = true;

// Check server action returns data
import { getPersonas } from '@/lib/persona-actions';
const personas = await getPersonas();
console.log('Personas:', personas);
```

#### Issue: Premium Features Show "Upgrade Required"

**Symptoms:**
- Premium features restricted even for premium users
- `isPremium` flag not working

**Root Cause:**
Premium status not set correctly in database

**Solution:**
```typescript
// Manually set premium status
UPDATE users SET is_premium = true WHERE id = 'user-uuid';
UPDATE users SET premium_expires_at = NOW() + INTERVAL '1 year' WHERE id = 'user-uuid';

// Verify in code
const profile = await getUserProfile(userId);
console.log('Premium:', profile.is_premium);
console.log('Expires:', profile.premium_expires_at);
```

### Debug Mode

Enable verbose logging:

```typescript
// src/lib/debug.ts
export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export function debugLog(label: string, data: any) {
  if (DEBUG) {
    console.log(`[DEBUG: ${label}]`, data);
  }
}
```

Use in code:
```typescript
debugLog('Chat Message Sent', { message, personaId });
debugLog('Gemini Response', response);
debugLog('Saved to Database', result);
```

Enable with: `NEXT_PUBLIC_DEBUG=true npm run dev`

---

## Future Roadmap

### Phase 1: Core Stability (Current)
- ✅ Chat with persona support
- ✅ Flashcard and quiz generation
- ✅ Note persistence
- ✅ Rate limiting and error handling
- [ ] Comprehensive test suite

### Phase 2: Enhanced Features (Q4 2025)
- [ ] Voice input/output
- [ ] Study plan generation
- [ ] Google Calendar integration
- [ ] Custom persona creation
- [ ] Analytics dashboard

### Phase 3: Monetization (Q1 2026)
- [ ] Stripe integration
- [ ] Freemium tier enforcement
- [ ] Premium feature analytics
- [ ] Usage dashboard for users

### Phase 4: Scale & Growth (Q2 2026)
- [ ] Public content marketplace
- [ ] SEO blog system
- [ ] Referral program
- [ ] Mobile app
- [ ] Offline support

### Phase 5: AI Enhancements (Q3 2026)
- [ ] Multi-model support (Anthropic Claude, OpenAI)
- [ ] Fine-tuned models for specific subjects
- [ ] Long-context document processing
- [ ] Real-time tutoring mode
- [ ] Video transcription support

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create pull request with description

### Code Style

- TypeScript strict mode enabled
- ESLint configuration enforced
- Format with Prettier on save
- Component naming: PascalCase for components, camelCase for functions
- File organization: Group related files together

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
- `feat(chat): add persona selector`
- `fix(api): handle 429 rate limit errors`
- `docs(personas): update persona list`

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Gemini API Docs:** https://ai.google.dev/docs
- **ShadCN UI:** https://ui.shadcn.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion/

---

**Last Updated:** November 1, 2025
**Repository:** https://github.com/avimaybee/focusflow
**License:** MIT
