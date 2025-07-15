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
- **Secure Authentication:** Supports Email/Password and Google Sign-In via **Firebase Authentication**.
- **Personalized Content:** Logged-in users have their generated summaries, quizzes, flashcard sets, study plans, and notes automatically saved to their personal "My Content" area, powered by **Firestore**.
- **Feature Gating:** The application supports a premium tier. A user's `isPremium` status, stored in their Firestore document, controls access to advanced features and lifts usage limits on core tools.

---

## 3. Technical Implementation & Flow

### a. Technology Stack
- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI, Framer Motion
- **Backend & Database:** Firebase (Authentication, Firestore, Functions)
- **AI:** Google Genkit, Google Gemini Models (e.g., `gemini-1.5-flash` for most tasks)

### b. Core Chat Flow
1.  **User Input:** The user sends a message or selects a tool from the `ChatPage` UI. They can also attach a file (like a PDF), which is converted to a Data URI on the client-side.
2.  **API Route:** A request is made to the `/api/chat` Next.js server route, containing the message, user auth token, and any contextual data (like a file's data URI or a selected persona).
3.  **Genkit Flow (`chatFlow`):** The API route invokes the main Genkit flow (`src/ai/flows/chat-flow.ts`).
4.  **Usage Check (for Tools):** Before executing a protected tool (like `createQuizTool`), the flow checks the user's `isPremium` status and their monthly usage count stored in Firestore. If a free user exceeds their limit, the flow returns an error.
5.  **Tool Dispatch:** The flow, powered by a Gemini model, determines user intent. It either formulates a direct conversational response or calls a specific, predefined **Genkit Tool** (e.g., `createQuizTool`, `summarizeNotesTool`). The file's Data URI is passed along, allowing the AI to "read" the document.
6.  **Structured Output:** Tools are designed to return structured JSON data (e.g., an array of flashcard objects, a quiz object with questions and answers).
7.  **Data Persistence:** If a tool was used, the `chatFlow` saves the generated content to the user's Firestore `My Content` subcollection (e.g., `/users/{userId}/quizzes/{quizId}`). The notepad content is saved to a dedicated `notepad` subcollection, with a debounced server action ensuring changes are saved automatically.
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
3.  **Genkit Media Handling:** The `chatFlow` was architected to correctly pass the Data URI to the Gemini model. The `chat.send()` method in Genkit natively supports a `media` object, so the Data URI is passed as `{ media: { url: context } }`. This tells Genkit to handle the base64 decoding and present the file content to the model in an optimal format.

This solution ensures that users can seamlessly upload documents, have them processed efficiently, and receive AI-generated insights based on the full context of their materials, which is the cornerstone of the FocusFlow AI experience.
meow