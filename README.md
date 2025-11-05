
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

## 3. Technical Implementation & Architecture

### a. Technology Stack

- **Frontend:**
  - **Next.js 14 (App Router):** The core framework for building the application, providing server-side rendering, static site generation, and a powerful routing system.
  - **React 18 & TypeScript:** For building a type-safe and component-based user interface.
  - **Tailwind CSS & shadcn/ui:** For a utility-first CSS workflow and a set of accessible and reusable UI components.
  - **Framer Motion:** For creating smooth and delightful animations and page transitions.
  - **Zustand:** For lightweight and scalable state management.

- **Backend & Database:**
  - **Supabase:** The all-in-one backend solution, providing authentication, a PostgreSQL database, and instant APIs.

- **AI & Machine Learning:**
  - **Google Gemini API:** The primary AI provider, used for generating text, powering the chat, and driving the smart tools.
  - **LangChain.js:** Used for building and managing complex AI-powered workflows and chains.

- **Testing:**
  - **Vitest:** A fast and modern testing framework for unit and integration tests.
  - **React Testing Library:** For testing React components in a user-centric way.
  - **Playwright:** For end-to-end testing and browser automation.

### b. Architectural Overview

FocusFlow AI is a modern full-stack application built with Next.js, Supabase, and the Google Gemini API. The architecture is designed to be scalable, maintainable, and performant.

- **Frontend:** The frontend is built with Next.js and React, following a component-based architecture. The UI is composed of a set of reusable components from `shadcn/ui` and custom components specific to the application's features.

- **Backend:** The backend is powered by Next.js API Routes and Supabase. The API routes handle requests from the client, interact with the Supabase database, and call the Google Gemini API.

- **Database:** The application uses a PostgreSQL database hosted on Supabase to store user data, chat history, notes, and other application-specific data.

### c. Core Chat Flow

1.  **User Input:** The user sends a message or selects a tool from the `ChatPage` UI. They can also attach a file, which is handled on the client-side.
2.  **API Route:** A request is made to the `/api/chat` Next.js API route, containing the message, user auth token, and any contextual data.
3.  **Chat Flow (`chatFlow`):** The API route invokes the main chat flow function in `src/ai/flows/chat-flow.ts`.
4.  **AI Processing:** The `chatFlow` function, powered by the Gemini API, processes the user's message along with the conversation history and persona context. It formulates a conversational response or triggers specific AI tools.
5.  **Structured Output:** The AI tools are designed to return structured JSON data (e.g., an array of flashcard objects, a quiz object with questions and answers).
6.  **Data Persistence:** If a tool was used, the `chatFlow` saves the generated content to the user's Supabase database.
7.  **Response to Client:** The flow returns a response object containing the AI's text and any structured data.
8.  **Frontend Rendering:** The `ChatPage` receives the response and renders the corresponding interactive component (`QuizViewer`, `FlashcardViewer`) or displays the formatted text response.

---

## 4. Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your_username/focusflow.git
    cd focusflow
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables. You can get these from your Supabase project settings.

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 5. Project Structure

```
.
├── src
│   ├── app
│   │   ├── api         # API routes for handling backend logic
│   │   ├── (pages)     # Directory-based routing for Next.js pages
│   │   └── layout.tsx  # The main layout component for the application
│   ├── components
│   │   ├── ui          # Generic, reusable UI components (from shadcn/ui)
│   │   └── (features)  # Components specific to a particular feature (e.g., chat, dashboard)
│   ├── lib             # Utility functions, Supabase client, and other shared code
│   ├── ai              # AI-related logic, including tools and chat flows
│   │   ├── flows       # Core AI workflows (e.g., chat-flow.ts)
│   │   └── tools.ts    # Definitions for the AI-powered tools
│   ├── hooks           # Custom React hooks for managing state and side effects
│   ├── context         # React context providers for managing global state
│   └── types           # TypeScript type definitions
├── public              # Static assets like images and fonts
└── ...
```

## 6. Scripts

- `npm run dev`: Starts the development server with hot reloading.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the codebase using ESLint to identify and fix code quality issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run test`: Runs the unit and integration tests using Vitest.
- `npm run test:ui`: Runs the tests with the interactive Vitest UI.

## 7. Deployment

This application is deployed on [Cloudflare Pages](https://pages.cloudflare.com/). The deployment is automatically triggered on every push to the `main` branch. The `_worker.js` file in the root of the project is used to configure the Cloudflare worker for this application.
