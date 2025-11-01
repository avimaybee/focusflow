# FocusFlow AI: Student's AI Co-Pilot

# FocusFlow AI: Student's AI Co-Pilot

An intelligent, all-in-one study toolkit powered by Google Gemini AI. FocusFlow provides conversational assistance, flashcard generation, quiz creation, and personalized learning experiences—all in one intuitive interface.

An intelligent, all-in-one study toolkit powered by Google Gemini AI. FocusFlow provides conversational assistance, flashcard generation, quiz creation, and personalized learning experiences—all in one intuitive interface.

## ⚡ Quick Start

> **📚 For Complete Documentation:** See [`MASTER_DOCUMENTATION.md`](./MASTER_DOCUMENTATION.md)

```bash

# 1. Clone & Install## 1. Application Vision & UI/UX Philosophy

git clone https://github.com/avimaybee/focusflow.git

cd focusflowFocusFlow AI is an intelligent, all-in-one study toolkit designed to be a student's proactive co-pilot. The core vision is to deliver sophisticated AI-powered assistance through a simple, intuitive, and delightful interface.

npm install

### UI/UX Goals:

# 2. Setup Environment Variables- **Effortless Intelligence:** AI interactions feel natural and predictive, not cumbersome.

cp .env.example .env.local- **Intuitive Harmony:** The interface is clean, with ample whitespace, consistent components, and a clear visual hierarchy, ensuring every interaction is intentional.

# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY- **Minimalist Design:** Built with **ShadCN UI** and **Tailwind CSS**, the app features a professional dark theme (`#1B1F23`), a primary blue accent (`#3B82F6`), and refined typography (Satoshi for headings, Inter for body text).

- **Subtle Delight:** Micro-animations using **Framer Motion** are employed for smooth transitions, component reveals (like the Smart Tools menu), and interactive elements to create a satisfying user experience.

# 3. Run Development Server

npm run dev---



# Open http://localhost:3000## 2. Core Features

```

### a. Conversational AI Chat

## 🎯 Key FeaturesThe central feature is a dynamic chat interface where users interact with an AI study assistant. It supports text input and file uploads (PDF, images, text) to provide context for conversations.



- **🤖 AI Chat:** Conversational assistant with persona selection### b. Integrated Notes Panel

- **📇 Flashcards:** Instant generation from chat contextA persistent, side-by-side notepad lives alongside the main chat interface. Users can seamlessly send selected text from an AI's response directly to their notes with a single click, or type freely into the notepad. The content is auto-saved, providing a fluid experience for capturing ideas, drafting outlines, and collecting important information without ever leaving the chat view.

- **🧪 Quizzes:** Multiple-choice quizzes with instant feedback

- **📝 Notes:** Auto-saving notepad alongside chat### c. Customizable AI Personas

- **🎓 Study Plans:** AI-generated study schedulesUsers can select from a variety of AI personas (e.g., *Explain Like I'm 5*, *Brutally Honest Mentor*, *Cram Buddy*) to tailor the AI's tone and teaching style to their specific learning needs.

- **🔥 Gamification:** Study streaks and achievement badges

- **👤 Personas:** 10 unique AI teaching styles### d. Integrated Study Tools

- **Flashcard & Quiz Generation:** From any AI response or user-provided text, users can instantly generate interactive, flippable flashcards and multiple-choice quizzes directly within the chat interface. These are core, first-class features.

## 📚 Documentation- **Smart Text Utilities:** A context-aware toolbar appears under AI messages, offering tools to `Rewrite Text`, `Convert to Bullets`, `Find Counterarguments`, and `Create a Presentation Outline`.



**For complete technical documentation, see [`MASTER_DOCUMENTATION.md`](./MASTER_DOCUMENTATION.md)** which includes:### e. Prompt Template Library

A rich library of pre-made prompts helps users kickstart complex tasks like creating study plans, proofreading text, or brainstorming essay ideas.

- Project overview and vision

- Architecture & technology stack### f. User Dashboard & Gamification

- Database schema & migrationsA personalized dashboard tracks user activity and progress.

- API endpoints & implementation- **KPIs:** Displays counts of summaries, quizzes, and flashcards created.

- Development guide & troubleshooting- **Progress Tracking:** A chart visualizes weekly study sessions against user-set goals.

- Future roadmap- **Gamification:** Features a "Study Streak" counter and unlockable badges to motivate consistent learning.



**Other Resources:**### g. Authentication & Content Persistence

- Archived documentation: [`docs/archived-md/`](./docs/archived-md/)- **Secure Authentication:** Supports Email/Password authentication via **Supabase**.

- **Personalized Content:** Logged-in users have their generated summaries, quizzes, flashcard sets, study plans, and notes automatically saved to their personal "My Content" area, powered by **Supabase**.

## 🛠️ Tech Stack- **Feature Gating:** The application supports a premium tier. A user's `isPremium` status, stored in their Supabase profile, controls access to advanced features and lifts usage limits on core tools.



| Layer | Technology |---

|-------|-----------|

| Frontend | Next.js, React, TypeScript |## 3. Technical Implementation & Flow

| Styling | Tailwind CSS, ShadCN UI, Framer Motion |

| Backend | Node.js, Next.js API Routes |### a. Technology Stack

| Database | Supabase (PostgreSQL) |- **Frontend:** Next.js (App Router), React, TypeScript

| Auth | Supabase Auth |- **Styling:** Tailwind CSS, ShadCN UI, Framer Motion

| AI | Google Gemini 2.5 Flash |- **Backend & Database:** Supabase (Authentication, Database)

| Hosting | Cloudflare Pages |- **Deployment:** Cloudflare

- **AI:** Google Gemini API (using `gemini-2.5-flash` model with 65,536 max output tokens)

## 📋 Environment Variables

### b. Core Chat Flow

```env1.  **User Input:** The user sends a message or selects a tool from the `ChatPage` UI. They can also attach a file (like a PDF), which is converted to a Data URI on the client-side.

# Supabase2.  **API Route:** A request is made to the `/api/chat` Next.js server route, containing the message, user auth token, and any contextual data (like a file's data URI or a selected persona).

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co3.  **Chat Flow (`chatFlow`):** The API route invokes the main chat flow function (`src/ai/flows/chat-flow.ts`).

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key4.  **Usage Check (for Tools):** Before executing a protected tool (like `createQuizTool`), the flow checks the user's `isPremium` status and their monthly usage count in the Supabase database. If a free user exceeds their limit, the flow returns an error.

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key5.  **AI Processing:** The flow, powered by the Gemini 2.0 Flash Lite model, processes the user's message along with conversation history and persona context. It formulates a conversational response or triggers specific AI tools (e.g., `createQuizTool`, `summarizeNotesTool`). The file's Data URI is passed along, allowing the AI to "read" the document.

6.  **Structured Output:** Tools are designed to return structured JSON data (e.g., an array of flashcard objects, a quiz object with questions and answers).

# AI7.  **Data Persistence:** If a tool was used, the `chatFlow` saves the generated content to the user's Supabase database (e.g., in a `quizzes` table). The notepad content is saved to a dedicated `notepad` table, with a debounced server action ensuring changes are saved automatically.

GEMINI_API_KEY=your-gemini-api-key8.  **Response to Client:** The flow returns a response object containing the AI's text and any structured data (like the quiz object).

9.  **Frontend Rendering:** The `ChatPage` receives the response. If structured data is present, it renders the corresponding interactive component (`QuizViewer`, `FlashcardViewer`); otherwise, it displays the formatted text response.
# App
NEXT_PUBLIC_SITE_URL=https://focusflow.com
```

## 🚀 Development

### Project Structure

```
focusflow/
├── src/
│   ├── app/              # Next.js routes
│   ├── components/       # React components
│   ├── ai/              # AI flows and tools
│   ├── lib/             # Utilities and server actions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── middleware.ts    # Auth middleware
├── supabase/
│   ├── migrations/      # SQL migrations
│   └── types/           # Generated types
├── docs/                # Documentation
└── public/              # Static assets
```

### Common Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Linting
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test
```

### Database Migrations

```bash
# Link to Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push local migrations
npx supabase db push

# Pull migrations from remote
npx supabase db pull
```

## 🐛 Troubleshooting

### Rate Limiting Issues

If you see "429 Too Many Requests" errors:
- The system automatically retries with exponential backoff
- Free tier limit: 10 requests per minute
- Wait 30 seconds before sending more messages

### Chat History Not Loading

- Verify database connection: Check `NEXT_PUBLIC_SUPABASE_URL` and keys
- Check Supabase dashboard: Verify `chat_messages` table exists
- Check browser console for errors

### Personas Not Appearing

- Verify `personas` table is populated in Supabase
- Check server logs for query errors
- Personas table should have 10 rows with `is_active = true`

For more troubleshooting: See [MASTER_DOCUMENTATION.md - Troubleshooting](./MASTER_DOCUMENTATION.md#troubleshooting--known-issues)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes with TypeScript types
3. Test locally: `npm run dev`
4. Commit with clear message: `feat(scope): description`
5. Push and create a pull request

### Code Standards

- TypeScript strict mode enabled
- ESLint & Prettier enforced
- Components: PascalCase naming
- Utility functions: camelCase naming
- Group related files together

## 📈 Roadmap

- ✅ Core chat with personas
- ✅ Flashcard & quiz generation
- ✅ Rate limiting system
- 🔜 Voice input/output
- 🔜 Google Calendar sync
- 🔜 Custom persona creation
- 🔜 Analytics dashboard
- 🔜 Mobile app
- 🔜 SEO blog system

## 📄 License

MIT License - See LICENSE file

## 🔗 Links

- **GitHub:** https://github.com/avimaybee/focusflow
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Gemini API:** https://ai.google.dev/docs

## 💬 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** support@focusflow.com

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0

For detailed technical documentation, see [`MASTER_DOCUMENTATION.md`](./MASTER_DOCUMENTATION.md).
