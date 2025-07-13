FocusFlow AI: Comprehensive Task-Dependency Roadmap (UI/UX-Driven)
Core Principles & Vision of Polish:
Effortless Intelligence: AI feels like a natural, proactive co-pilot. Sophisticated results delivered with remarkable simplicity.
Intuitive Harmony: Seamless transitions, consistent elements, and clear visual hierarchy. Every pixel and interaction is intentional.
Subtle Delight & Emotional Resonance: Micro-interactions evoke satisfaction and support. The app feels rewarding and understanding.
Professional Minimalism with Unique Character: Clean, uncluttered design that highlights core value, distinguished by custom AI iconography and a refined color palette.
Unwavering Reliability: Underlying robustness ensures fast responses and persistent data, building user trust.
Phase 1: Core Infrastructure & Foundational UI (Current State + Refinements)
This phase establishes the absolute core, with initial UI polish.
1. Project Setup & Core UI Shell
* Task: Next.js (App Router), TypeScript, Tailwind CSS, ShadCN UI setup.
* Description: Initialize project. Ensure all basic ShadCN components are correctly themed and provide a consistent base for styling.
* Dependencies: None.
* Task: Global Dark Theme & Typography (Poppins/PT Sans).
* Description: Define CSS variables for the #1B1F23 background, #89B9F2 primary blue, and #B788E6 accent purple. Implement Poppins for headers and PT Sans for body text with a strict typography scale (sizes, weights, line heights) for consistent visual hierarchy.
* Dependencies: 1.1.
* Task: Implement Core Chat Layout (/chat route) with Refined Spacing.
* Description: Build the main 2-column layout. Implement a strict spacing system (e.g., multiples of 4px/8px for padding, margins) to ensure consistent breathing room.
* Dependencies: 1.1, 1.2.
* UI/UX Goal: Achieve the polished look from your latest screenshot, emphasizing ample whitespace and clear component separation.
* Task: Persistent Header & Footer with Polished Elements.
* Description: Implement FocusFlow AI logo (with subtle AI sparkle icon), Go Premium button (accent purple) in the header. Add subtle, low-contrast footer text. Ensure consistent padding and alignment.
* Dependencies: 1.3.
2. Authentication & User Management
* Task: Firebase Authentication Setup (Email/Password, Google Sign-In).
* Description: Integrate Firebase Auth.
* Dependencies: Firebase Project Setup.
* Task: User Session Management & Secure Route Protection.
* Description: Handle user login/logout states. Redirect authenticated users to /chat or /dashboard. Protect routes.
* Dependencies: 2.1.
* Task: User Profile in Firestore.
* Description: Create users/{userId} document for profile data (email, displayName, createdAt, isPremium, preferredPersona).
* Dependencies: 2.1.
* Task: Implement Login/Signup UI with Clear Flow.
* Description: Create dedicated /login and /signup pages. Ensure form inputs, buttons, and links are consistently styled with defined color palette and border-radius.
* Dependencies: 2.1.
* Task: Display User Info in Sidebar Footer.
* Description: Show user's avatar/initials and email/plan status (Free Plan) with consistent padding and typography.
* Dependencies: 2.2, 1.3.
3. Core AI Integration (Genkit & Initial Chat Functionality)
* Task: Genkit Integration & Setup.
* Description: Configure Genkit to connect to Google's Gemini models.
* Dependencies: None.
* Task: Basic Chat Message Sending & Display with Micro-Animations.
* Description: Implement sending user input and displaying AI responses.
* Dependencies: 1.3, 3.1.
* UI/UX Goal:
* User Bubbles: Right-aligned, distinct background color, consistent padding.
* AI Bubbles: Left-aligned, with a subtle AI sparkle icon next to each message for clear attribution.
* Message Entry Animation: New messages slide up from the bottom or fade in with a slight bounce (Framer Motion).
* AI Typing Indicator: Smooth, continuous typing animation (e.g., ... or subtle wave) in the AI's message bubble during processing.
* Task: Implement Intentional "How can I help you today?" Empty State.
* Description: Display the initial welcome message (H2 Poppins) with a grid of actionable prompt cards.
* Dependencies: 1.3.
* UI/UX Goal: Match current screenshot. Prompt cards should have consistent sizing, spacing, and subtle hover effects.
4. Initial AI Features via Chat Integration (Structured Output)
* Task: Genkit Flow: summarizeNotes & Structured Chat Output.
* Description: Create Genkit flow. When triggered, process text/PDF and return summary/keywords.
* Dependencies: 3.1, 3.2, 4.3 (from Phase 2, Task 4.3), 4.4 (from Phase 2, Task 4.4).
* UI/UX Goal: Display summary as a distinct, scrollable card within an AI chat bubble. Keywords as small, distinct tags/badges below the summary. Clear "Copy Summary", "Download", "Share Publicly" buttons within the card, with consistent styling and hover effects.
* Task: Genkit Flow: createStudyPlan & Structured Chat Output.
* Description: Create Genkit flow. Prompt for inputs. Display HTML table output in chat.
* Dependencies: 3.1, 3.2.
* UI/UX Goal: Render the study plan table cleanly within an AI chat bubble, styled to match app's typography and colors.
* Task: Genkit Flow: brainstormIdeas & Structured Chat Output.
* Description: Create Genkit flow. Display ideas list in chat.
* Dependencies: 3.1, 3.2.
* UI/UX Goal: Present ideas as clear bullet points or a numbered list within an AI chat bubble.
* Task: Genkit Flow: explainConcept & Structured Chat Output.
* Description: Create Genkit flow. Display explanation in chat.
* Dependencies: 3.1, 3.2.
* UI/UX Goal: Provide concise, well-formatted explanations, potentially with bolded terms or short bullet points for clarity.
5. Basic Chat History & Persistent Storage
* Task: Firestore Schema for Chat History.
* Description: Define Firestore schema for users/{userId}/chats/{chatId} (metadata) and users/{userId}/chats/{chatId}/messages/{messageId} (actual chat turns). Include persona and attachedFileRefs in chatId metadata.
* Dependencies: 2.3.
* Task: Save Chat Messages to Firestore.
* Description: Every user and AI message is saved to the active chat's messages subcollection.
* Dependencies: 5.1, 3.2.
* Task: Display Recent Chats in Sidebar with Clear Active State.
* Description: Fetch users/{userId}/chats and display titles in the sidebar.
* Dependencies: 5.1, 1.3, 2.2.
* UI/UX Goal: Clear visual distinction for the active chat (e.g., accent background color, bold text). Subtle hover effect for all chat items.
* Task: Load Chat History on Selection with Smooth Transition.
* Description: When a user clicks a chat in the sidebar, fetch and display its messages.
* Dependencies: 5.3.
* UI/UX Goal: Implement a smooth transition (e.g., fade out old chat, fade in new chat content) when switching conversations.
Phase 2: Advanced AI Interactions & Core Features (Deep Integration)
This phase integrates more sophisticated AI capabilities and core features directly into the chat, emphasizing seamless flow and contextual guidance.
1. AI Persona Selector (🧑‍🎭)
* Task: Implement Persona Selector UI with Clear State.
* Description: Dropdown or quick-select buttons in the chat header/settings to choose AI persona.
* Dependencies: 1.3 (Chat Header).
* UI/UX Goal: Visually distinct icons/names for each persona. Clear active state. Consider a subtle visual cue (e.g., a slight hue shift in AI message bubbles or a small badge next to the AI avatar) to reflect the active persona.
* Task: Backend Logic for Persona-Adjusted Prompts.
* Description: Modify all Genkit flows to accept a persona parameter and dynamically adjust Gemini's prompt instructions (tone, depth, style).
* Dependencies: 1.1 (from Phase 2, Task 1.1), All Genkit flows.
* Task: Persist User's Preferred Persona.
* Description: Save the selected persona to users/{userId} document.
* Dependencies: 1.2 (from Phase 2, Task 1.2), 2.3 (from Phase 1).
2. Contextual File Upload (📎)
* Task: Implement Drag-and-Drop / File Picker with Visual Feedback.
* Description: Add a clear UI for uploading PDFs and images via the input bar's attachment icon or a drag-and-drop zone.
* Dependencies: 1.3 (Input Bar).
* UI/UX Goal: Intuitive drag-and-drop zone. Visual feedback during upload (e.g., progress bar, file icon transforming).
* Task: File Management Pills Above Input.
* Description: Display uploaded files as small, dismissible "pills" above the chat input, indicating they are "contextual."
* Dependencies: 2.1 (from Phase 2, Task 2.1).
* UI/UX Goal: Clean, stackable file pills with clear "X" to remove.
* Task: Firebase Storage for Uploaded Files.
* Description: Securely store uploaded files.
* Dependencies: 2.2 (from Phase 2, Task 2.2).
* Task: Firebase Functions for File Processing (PDF Text / Image OCR).
* Description: Trigger Cloud Functions on Storage upload. Extract text from PDFs, OCR images. Store extracted text (or link to Storage ref) in users/{userId}/uploadedFiles subcollection.
* Dependencies: 2.3 (from Phase 2, Task 2.3).
* Task: Pass Processed File Content as Genkit Context.
* Description: Modify relevant Genkit flows to accept contextStrings (from processed files) as additional input for the Gemini prompt.
* Dependencies: 2.4 (from Phase 2, Task 2.4), All relevant Genkit flows.
3. Smart Tools & Utilities (🛠️)
* Task: "Smart Tools" Menu within Chat (via + icon).
* Description: Implement a + icon in the chat input bar that reveals a clean, overlay menu or modal for "Smart Tools."
* Dependencies: 1.3 (Input Bar).
* UI/UX Goal: Menu items should be clearly labeled cards/buttons with icons. Smooth reveal animation for the menu.
* Task: Genkit Flow: rewriteText (less AI, clarity).
* Description: New Genkit flow to rephrase text with specified tone/clarity.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* UI/UX Goal: New rewritten text appears in a new chat bubble, clearly indicated as a "rewrite."
* Task: Genkit Flow: convertBulletPoints.
* Description: New Genkit flow to extract key points and format as bulleted list.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* Task: Genkit Flow: generateCounterarguments.
* Description: New Genkit flow to analyze a statement and generate opposing arguments.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* Task: Genkit Flow: generatePresentationOutline.
* Description: New Genkit flow to structure content into a presentation outline.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* Task: Genkit Flow: highlightKeyInsights.
* Description: New Genkit flow to identify and highlight crucial takeaways from text.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
4. Integrated Core Features (Flashcards & Quizzes)
* Task: Genkit Flow: createFlashcards & In-Chat Interactive Viewer.
* Description: Create Genkit flow. Integrate into chat ("Create flashcards from this").
* Dependencies: 3.1 (from Phase 2, Task 3.1), 4.4 (from Phase 1).
* UI/UX Goal: Display interactive, flippable mini-cards directly within a chat bubble. Include "View Full Set" link for a dedicated full-page experience. Cards animate "dealing" onto the screen.
* Task: Genkit Flow: createQuiz & In-Chat Interactive Quiz.
* Description: Create Genkit flow. Integrate into chat ("Take a quiz on this").
* Dependencies: 3.1 (from Phase 2, Task 3.1), 4.4 (from Phase 1).
* UI/UX Goal: Display interactive quiz (question, options, input, immediate feedback) directly within a chat bubble. Smooth question transitions.
5. Prompt Template Library (🧰)
* Task: Prompt Template UI Access & Selection.
* Description: Integrate prompt template access via the + icon menu in the input bar.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* UI/UX Goal: Clear, well-spaced grid/list of clickable template cards.
* Task: Pre-made Prompt Template Library.
* Description: Configure a list of common templates. Pre-fill chat input with selected template.
* Dependencies: 5.1 (from Phase 2, Task 5.1).
Phase 3: Persistence, Dashboard & Freemium
This phase builds out user-specific data management and monetization, with visual rewards.
1. Persistent User-Generated Content (UGC) History
* Task: Firestore Schema for User Content (Summaries, Flashcards, Quizzes, Study Plans).
* Description: Define collections: users/{userId}/summaries, users/{userId}/flashcardSets, users/{userId}/quizzes, users/{userId}/studyPlans.
* Dependencies: 2.3 (from Phase 1).
* Task: Save Generated Content to Firestore.
* Description: After AI generates content, save it to the user's corresponding Firestore subcollection.
* Dependencies: All Genkit flows, 1.1 (from Phase 3, Task 1.1).
* Task: Implement "My Content" Pages with Clean Layout.
* Description: Create dedicated pages (e.g., /my-content/summaries) for logged-in users to view and manage their saved content.
* Dependencies: 1.2 (from Phase 3, Task 1.2).
* UI/UX Goal: Consistent card-based layout for content items. Clear actions (View, Edit, Delete, Share Publicly).
2. Progress Tracker (Functional & Visually Rewarding)
* Task: Firestore Schema for Tracker Data.
* Description: Define users/{userId}/studySessions and users/{userId}/goals subcollections.
* Dependencies: 2.3 (from Phase 1).
* Task: Implement "Log Study Session" Form & Logic.
* Description: Connect the form to save studySession data to Firestore.
* Dependencies: 2.1 (from Phase 3, Task 2.1).
* UI/UX Goal: Clear input fields, immediate visual confirmation (e.g., toast) upon logging.
* Task: Implement "Set/Update Weekly Goals" Form & Logic.
* Description: Connect the form to save/update goal data to Firestore.
* Dependencies: 2.1 (from Phase 3, Task 2.1).
* Task: Dynamic Chart for Progress Tracker.
* Description: Fetch studySessions and goals data from Firestore and render the Recharts bar graph dynamically. Update in real-time.
* Dependencies: 2.2 (from Phase 3, Task 2.2), 2.3 (from Phase 3, Task 2.3).
* UI/UX Goal: Chart colors align with app palette. Smooth transitions/animations as data updates.
3. User Dashboard (Personalized & Actionable)
* Task: Implement /dashboard UI with Personalized Welcome.
* Description: Create the dashboard page to display KPIs.
* Dependencies: 2.3 (from Phase 1).
* UI/UX Goal: "Welcome Back, Alex!" with avatar. KPI cards are visually appealing and well-spaced.
* Task: Backend Logic for Dashboard Stats (Server Actions).
* Description: Create server actions (getDashboardStats) to aggregate data.
* Dependencies: 1.2 (from Phase 3, Task 1.2), 2.2 (from Phase 3, Task 2.2), 2.3 (from Phase 3, Task 2.3).
* Task: Implement "Weekly Activity" Chart.
* Description: Display a recharts bar chart visualizing weekly study activity.
* Dependencies: 3.2 (from Phase 3, Task 3.2).
* Task: Gamification: Study Streaks & Badges.
* Description: Display currentStudyStreak on Dashboard. Implement badge earning criteria (Firebase Functions) and visually display earned badges.
* Dependencies: 2.2 (from Phase 3, Task 2.2).
* UI/UX Goal: Visually engaging streak counter (e.g., growing flame icon). Celebratory animations (confetti, starburst) when a new badge is earned. Dedicated "Achievements" section.
4. Freemium Logic & Monetization
* Task: Define Freemium Tiers & Feature Gating.
* Description: Clearly define free usage limits. Identify premium features.
* Dependencies: 2.3 (from Phase 1).
* Task: Implement Usage Tracking in Firestore.
* Description: Track monthly usage in users/{userId}.
* Dependencies: 4.1 (from Phase 3, Task 4.1), 1.2 (from Phase 3, Task 1.2).
* Task: Scheduled Firebase Function for Monthly Usage Reset.
* Description: Cloud Function to reset usage counts.
* Dependencies: 4.2 (from Phase 3, Task 4.2).
* Task: Implement Feature Gating UI/UX with Clear Upsell.
* Description: Before calling Genkit flows or unlocking premium UI, check isPremium and limits.
* Dependencies: 4.2 (from Phase 3, Task 4.2), All Genkit flows/features.
* UI/UX Goal: Clear, non-punitive upgrade modals (e.g., "Unlock unlimited intelligence"). Consistent "Go Premium" button (accent purple) in header and modals.
* Task: Implement /premium Page.
* Description: Dedicated page outlining premium benefits.
* Dependencies: None.
* Task: Stripe Billing Integration (via Firebase Extension).
* Description: Use Stripe Extension to handle subscriptions. Webhooks update isPremium status.
* Dependencies: 4.4 (from Phase 3, Task 4.4), Stripe Account.
* Task: Google Calendar Sync for Study Planner (Premium).
* Description: For premium users, implement Google OAuth and Calendar API via Firebase Function to create events.
* Dependencies: 4.4 (from Phase 3, Task 4.4), 4.6 (from Phase 3, Task 4.6), 4.2 (from Phase 1).
Phase 4: SEO & Advanced Features
This phase focuses on maximizing organic reach and delivering unique, delightful value.
1. SEO & Discoverability (UGC as Asset)
* Task: "Make Public" Functionality for All Content.
* Description: Allow users to make Summaries, Flashcards, Quizzes, Study Plans public. Creates records in separate top-level public collections with publicSlug.
* Dependencies: 1.2 (from Phase 3, Task 1.2).
* UI/UX Goal: Clear "Share Publicly" button on output cards. Confirmation modal with direct shareable URL.
* Task: Next.js Dynamic Routes for Public UGC.
* Description: Implement /summaries/[slug], /flashcards/[slug], /quizzes/[slug], /plans/[slug].
* Dependencies: 1.1 (from Phase 4, Task 1.1).
* Task: Dynamic SEO Titles & Meta Descriptions for UGC.
* Description: Use generateMetadata to set <title>, <meta name="description">, <meta name="keywords"> for all public UGC pages.
* Dependencies: 1.2 (from Phase 4, Task 1.2).
* Task: Structured Data (JSON-LD) for All UGC.
* Description: Implement Article, Quiz, HowTo, EducationalMaterial schemas.
* Dependencies: 1.2 (from Phase 4, Task 1.2).
* Task: Dynamic Sitemap Generation.
* Description: Update sitemap.ts to include all public UGC URLs.
* Dependencies: 1.1 (from Phase 4, Task 1.1).
* Task: Firestore Security Rules for Public Collections.
* Description: Configure rules for public read access.
* Dependencies: 1.1 (from Phase 4, Task 1.1).
* Task: SEO Blog System (/blog).
* Description: Implement static blog. Ensure internal linking.
* Dependencies: 1.1 (from Phase 1).
2. Concept Memory & Side Notes (📚)
* Task: Highlight-to-Explain/Add-to-Notes UI.
* Description: Implement text selection listener. Pop-up with "Explain (AI)" and "Add to Concept Notes."
* Dependencies: 1.3 (Chat UI).
* UI/UX Goal: Subtle, non-intrusive pop-up.
* Task: Genkit Flow: explainConcept (Contextual from Highlight).
* Description: Use existing explainConcept flow, providing highlighted text and context.
* Dependencies: 2.1 (from Phase 4, Task 2.1), 4.4 (from Phase 1).
* Task: Persistent Storage for Concept Notes.
* Description: Save highlighted text, AI explanation, source chat ID to users/{userId}/conceptNotes.
* Dependencies: 2.1 (from Phase 4, Task 2.1), 2.3 (from Phase 1).
* Task: Slide-Out Panel for Concept Notes.
* Description: Implement a right-side panel to display and search saved concept notes.
* Dependencies: 2.3 (from Phase 4, Task 2.3).
* UI/UX Goal: Smooth slide-out animation for the panel. Clear list of notes with search/tagging.
* Task: Search & Tag Functionality within Notes.
* Description: Enable search and tagging for saved concept notes.
* Dependencies: 2.4 (from Phase 4, Task 2.4).
3. Advanced Input Modes (🔍)
* Task: Voice Input & Output.
* Description: Implement speech-to-text for input and text-to-speech for AI responses.
* Dependencies: 1.3 (Chat UI).
* UI/UX Goal: Clear microphone icon. Visual feedback when listening/speaking.
* Task: Markdown Editor Toggle for Input.
* Description: Toggle for a rich text editor that supports Markdown for formatting user queries.
* Dependencies: 1.3 (Chat UI).
* Task: Casual/Formal Tone Toggle.
* Description: Add a quick toggle in the input area that sends a tone parameter to Genkit flows.
* Dependencies: 1.3 (Chat UI), All Genkit flows.
4. Unique & Differentiating AI Features (💡)
* Task: AI-Generated Mnemonics & Memory Aids (Genkit Flow).
* Description: New Genkit flow. Integrate as a Smart Tool.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* UI/UX Goal: Present creative memory aids in an engaging, easily digestible format.
* Task: AI-Generated Study Group Prompts (Genkit Flow).
* Description: New Genkit flow.
* Dependencies: 3.1 (from Phase 2, Task 3.1).
* Task: "Teach Me This Over Time" Spaced Repetition System (SRS).
* Description: Allow users to add concepts to SRS. Implement review prompts via Dashboard/Notifications.
* Dependencies: 2.3 (from Phase 4, Task 2.3), 3.3 (from Phase 3, Task 3.3).
* UI/UX Goal: Review prompts are clear and integrated into the daily flow. Progress in SRS is visually tracked.
* Task: Visual Mode: AI-Generated Diagrams/Flowcharts (Premium).
* Description: Genkit flow outputs mermaid.js or DOT syntax. Frontend renders diagrams in chat.
* Dependencies: 4.6 (from Phase 3, Task 4.6), 1.3 (Chat UI).
* UI/UX Goal: Diagrams render smoothly within chat. Interactive elements (zoom, pan).
* Task: Collaborative Study Mode (Multi-User Chat with AI).
* Description: Allow users to create shared study rooms where multiple users and AI interact in real-time.
* Dependencies: 1.3 (Chat UI), Firebase Authentication.
* UI/UX Goal: Real-time message updates. Clear indication of other users.
